/// MoveFlow Yield Vault - Core vault implementation for Movement Network
module moveflow::vault {
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    const E_INVALID_AMOUNT: u64 = 4;
    const E_NOT_ADMIN: u64 = 5;
    const E_VAULT_PAUSED: u64 = 6;
    const E_MAX_STRATEGIES_REACHED: u64 = 8;

    /// Constants
    const MAX_STRATEGIES: u64 = 10;
    const BASIS_POINTS: u64 = 10000;
    const PERFORMANCE_FEE_BPS: u64 = 1000; // 10%
    const WITHDRAWAL_FEE_BPS: u64 = 10; // 0.1%

    /// Strategy info stored in vault
    struct StrategyInfo has store, drop, copy {
        name: String,
        allocation_bps: u64,
        active: bool,
        total_deposited: u64,
        total_earned: u64,
        apy_bps: u64,
    }

    /// Main vault resource
    struct Vault<phantom CoinType> has key {
        total_assets: u64,
        total_shares: u64,
        reserves: Coin<CoinType>,
        admin: address,
        is_paused: bool,
        strategies: vector<StrategyInfo>,
        last_harvest: u64,
        total_yield_earned: u64,
        performance_fee_collected: u64,
        min_deposit: u64,
        signer_cap: account::SignerCapability,
    }

    /// User position in the vault
    struct UserPosition<phantom CoinType> has key {
        shares: u64,
        deposit_time: u64,
        total_deposited: u64,
        total_withdrawn: u64,
    }

    /// Global registry of all vaults
    struct VaultRegistry has key {
        vault_addresses: vector<address>,
        total_tvl: u64,
    }

    /// Events
    struct VaultEvents<phantom CoinType> has key {
        deposit_events: EventHandle<DepositEvent>,
        withdraw_events: EventHandle<WithdrawEvent>,
        harvest_events: EventHandle<HarvestEvent>,
    }

    struct DepositEvent has drop, store {
        user: address,
        amount: u64,
        shares_minted: u64,
        timestamp: u64,
    }

    struct WithdrawEvent has drop, store {
        user: address,
        amount: u64,
        shares_burned: u64,
        timestamp: u64,
    }

    struct HarvestEvent has drop, store {
        yield_amount: u64,
        performance_fee: u64,
        timestamp: u64,
    }

    /// Initialize the vault registry
    public entry fun initialize_registry(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<VaultRegistry>(admin_addr), E_ALREADY_INITIALIZED);

        move_to(admin, VaultRegistry {
            vault_addresses: vector::empty(),
            total_tvl: 0,
        });
    }

    /// Create a new vault for a specific coin type
    public entry fun create_vault<CoinType>(
        admin: &signer,
        min_deposit: u64,
    ) acquires VaultRegistry {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<Vault<CoinType>>(admin_addr), E_ALREADY_INITIALIZED);

        let (vault_signer, signer_cap) = account::create_resource_account(admin, b"moveflow_vault");
        let vault_addr = signer::address_of(&vault_signer);

        coin::register<CoinType>(&vault_signer);

        move_to(admin, Vault<CoinType> {
            total_assets: 0,
            total_shares: 0,
            reserves: coin::zero<CoinType>(),
            admin: admin_addr,
            is_paused: false,
            strategies: vector::empty(),
            last_harvest: timestamp::now_seconds(),
            total_yield_earned: 0,
            performance_fee_collected: 0,
            min_deposit,
            signer_cap,
        });

        move_to(admin, VaultEvents<CoinType> {
            deposit_events: account::new_event_handle<DepositEvent>(admin),
            withdraw_events: account::new_event_handle<WithdrawEvent>(admin),
            harvest_events: account::new_event_handle<HarvestEvent>(admin),
        });

        if (exists<VaultRegistry>(admin_addr)) {
            let registry = borrow_global_mut<VaultRegistry>(admin_addr);
            vector::push_back(&mut registry.vault_addresses, vault_addr);
        };
    }

    /// Deposit tokens into the vault
    public entry fun deposit<CoinType>(
        user: &signer,
        vault_addr: address,
        amount: u64,
    ) acquires Vault, UserPosition, VaultEvents {
        let user_addr = signer::address_of(user);
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);

        assert!(!vault.is_paused, E_VAULT_PAUSED);
        assert!(amount >= vault.min_deposit, E_INVALID_AMOUNT);

        let shares_to_mint = if (vault.total_shares == 0) {
            amount
        } else {
            (amount * vault.total_shares) / vault.total_assets
        };

        let deposit_coins = coin::withdraw<CoinType>(user, amount);
        coin::merge(&mut vault.reserves, deposit_coins);

        vault.total_assets = vault.total_assets + amount;
        vault.total_shares = vault.total_shares + shares_to_mint;

        if (!exists<UserPosition<CoinType>>(user_addr)) {
            move_to(user, UserPosition<CoinType> {
                shares: shares_to_mint,
                deposit_time: timestamp::now_seconds(),
                total_deposited: amount,
                total_withdrawn: 0,
            });
        } else {
            let position = borrow_global_mut<UserPosition<CoinType>>(user_addr);
            position.shares = position.shares + shares_to_mint;
            position.total_deposited = position.total_deposited + amount;
        };

        let events = borrow_global_mut<VaultEvents<CoinType>>(vault_addr);
        event::emit_event(&mut events.deposit_events, DepositEvent {
            user: user_addr,
            amount,
            shares_minted: shares_to_mint,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Withdraw tokens from the vault
    public entry fun withdraw<CoinType>(
        user: &signer,
        vault_addr: address,
        shares_to_burn: u64,
    ) acquires Vault, UserPosition, VaultEvents {
        let user_addr = signer::address_of(user);
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        let position = borrow_global_mut<UserPosition<CoinType>>(user_addr);

        assert!(position.shares >= shares_to_burn, E_INSUFFICIENT_BALANCE);
        assert!(shares_to_burn > 0, E_INVALID_AMOUNT);

        let amount_to_withdraw = (shares_to_burn * vault.total_assets) / vault.total_shares;
        let fee = (amount_to_withdraw * WITHDRAWAL_FEE_BPS) / BASIS_POINTS;
        let net_amount = amount_to_withdraw - fee;

        let withdrawn_coins = coin::extract(&mut vault.reserves, net_amount);

        vault.total_assets = vault.total_assets - amount_to_withdraw;
        vault.total_shares = vault.total_shares - shares_to_burn;
        vault.performance_fee_collected = vault.performance_fee_collected + fee;

        position.shares = position.shares - shares_to_burn;
        position.total_withdrawn = position.total_withdrawn + net_amount;

        coin::deposit(user_addr, withdrawn_coins);

        let events = borrow_global_mut<VaultEvents<CoinType>>(vault_addr);
        event::emit_event(&mut events.withdraw_events, WithdrawEvent {
            user: user_addr,
            amount: net_amount,
            shares_burned: shares_to_burn,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Add a new strategy to the vault (admin only)
    public entry fun add_strategy<CoinType>(
        admin: &signer,
        vault_addr: address,
        name: String,
        allocation_bps: u64,
        initial_apy_bps: u64,
    ) acquires Vault {
        let admin_addr = signer::address_of(admin);
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);

        assert!(vault.admin == admin_addr, E_NOT_ADMIN);
        assert!(vector::length(&vault.strategies) < MAX_STRATEGIES, E_MAX_STRATEGIES_REACHED);

        let strategy = StrategyInfo {
            name,
            allocation_bps,
            active: true,
            total_deposited: 0,
            total_earned: 0,
            apy_bps: initial_apy_bps,
        };

        vector::push_back(&mut vault.strategies, strategy);
    }

    /// Harvest yields from strategies
    public entry fun harvest<CoinType>(
        _caller: &signer,
        vault_addr: address,
    ) acquires Vault, VaultEvents {
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        let time_elapsed = timestamp::now_seconds() - vault.last_harvest;
        
        let i = 0;
        let len = vector::length(&vault.strategies);
        let total_yield: u64 = 0;
        
        while (i < len) {
            let strategy = vector::borrow(&vault.strategies, i);
            if (strategy.active) {
                let allocated = (vault.total_assets * strategy.allocation_bps) / BASIS_POINTS;
                let strategy_yield = (allocated * strategy.apy_bps * time_elapsed) / (365 * 24 * 3600 * BASIS_POINTS);
                total_yield = total_yield + strategy_yield;
            };
            i = i + 1;
        };

        let performance_fee = (total_yield * PERFORMANCE_FEE_BPS) / BASIS_POINTS;
        let net_yield = total_yield - performance_fee;

        vault.total_assets = vault.total_assets + net_yield;
        vault.total_yield_earned = vault.total_yield_earned + net_yield;
        vault.performance_fee_collected = vault.performance_fee_collected + performance_fee;
        vault.last_harvest = timestamp::now_seconds();

        let events = borrow_global_mut<VaultEvents<CoinType>>(vault_addr);
        event::emit_event(&mut events.harvest_events, HarvestEvent {
            yield_amount: net_yield,
            performance_fee,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Pause/unpause vault (admin only)
    public entry fun set_paused<CoinType>(
        admin: &signer,
        vault_addr: address,
        paused: bool,
    ) acquires Vault {
        let admin_addr = signer::address_of(admin);
        let vault = borrow_global_mut<Vault<CoinType>>(vault_addr);
        assert!(vault.admin == admin_addr, E_NOT_ADMIN);
        vault.is_paused = paused;
    }

    // ============ View Functions ============

    #[view]
    public fun get_vault_info<CoinType>(vault_addr: address): (u64, u64, u64, bool, u64) acquires Vault {
        let vault = borrow_global<Vault<CoinType>>(vault_addr);
        (
            vault.total_assets,
            vault.total_shares,
            vault.total_yield_earned,
            vault.is_paused,
            vector::length(&vault.strategies)
        )
    }

    #[view]
    public fun get_user_position<CoinType>(user_addr: address): (u64, u64, u64, u64) acquires UserPosition {
        if (!exists<UserPosition<CoinType>>(user_addr)) {
            return (0, 0, 0, 0)
        };
        let position = borrow_global<UserPosition<CoinType>>(user_addr);
        (
            position.shares,
            position.deposit_time,
            position.total_deposited,
            position.total_withdrawn
        )
    }

    #[view]
    public fun get_share_value<CoinType>(vault_addr: address, shares: u64): u64 acquires Vault {
        let vault = borrow_global<Vault<CoinType>>(vault_addr);
        if (vault.total_shares == 0) {
            return shares
        };
        (shares * vault.total_assets) / vault.total_shares
    }
}
