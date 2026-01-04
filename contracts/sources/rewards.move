/// MoveFlow Rewards - Token rewards and incentives module
module moveflow::rewards {
    use std::signer;
    use std::string;
    use aptos_framework::coin::{Self, BurnCapability, MintCapability, FreezeCapability};
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_std::table::{Self, Table};

    /// Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_NO_REWARDS: u64 = 4;
    const E_POOL_NOT_FOUND: u64 = 5;

    /// FLOW Token - Native reward token
    struct FLOW has key {}

    /// Token capabilities
    struct FlowCapabilities has key {
        burn_cap: BurnCapability<FLOW>,
        mint_cap: MintCapability<FLOW>,
        freeze_cap: FreezeCapability<FLOW>,
    }

    /// Reward pool configuration
    struct RewardPool has store {
        vault_address: address,
        rewards_per_second: u64,
        total_staked: u64,
        acc_rewards_per_share: u64,
        last_reward_time: u64,
        end_time: u64,
        is_active: bool,
    }

    /// User reward info for a pool
    struct UserRewardInfo has store {
        amount: u64,
        reward_debt: u64,
        pending_rewards: u64,
        total_claimed: u64,
    }

    /// Rewards distributor state
    struct RewardsDistributor has key {
        admin: address,
        pools: Table<address, RewardPool>,
        user_info: Table<address, Table<address, UserRewardInfo>>,
        total_distributed: u64,
        precision: u64,
    }

    /// Events
    struct RewardsEvents has key {
        claim_events: EventHandle<ClaimEvent>,
        stake_events: EventHandle<StakeEvent>,
    }

    struct ClaimEvent has drop, store {
        user: address,
        pool: address,
        amount: u64,
        timestamp: u64,
    }

    struct StakeEvent has drop, store {
        user: address,
        pool: address,
        amount: u64,
        is_stake: bool,
        timestamp: u64,
    }

    /// Initialize FLOW token
    public entry fun initialize_flow_token(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<FlowCapabilities>(admin_addr), E_ALREADY_INITIALIZED);

        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<FLOW>(
            admin,
            string::utf8(b"MoveFlow Token"),
            string::utf8(b"FLOW"),
            8,
            true,
        );

        move_to(admin, FlowCapabilities {
            burn_cap,
            mint_cap,
            freeze_cap,
        });
    }

    /// Initialize rewards distributor
    public entry fun initialize_distributor(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<RewardsDistributor>(admin_addr), E_ALREADY_INITIALIZED);

        move_to(admin, RewardsDistributor {
            admin: admin_addr,
            pools: table::new(),
            user_info: table::new(),
            total_distributed: 0,
            precision: 1000000000000,
        });

        move_to(admin, RewardsEvents {
            claim_events: account::new_event_handle<ClaimEvent>(admin),
            stake_events: account::new_event_handle<StakeEvent>(admin),
        });
    }

    /// Create a new reward pool for a vault
    public entry fun create_pool(
        admin: &signer,
        distributor_addr: address,
        vault_address: address,
        rewards_per_second: u64,
        duration_seconds: u64,
    ) acquires RewardsDistributor {
        let admin_addr = signer::address_of(admin);
        let distributor = borrow_global_mut<RewardsDistributor>(distributor_addr);

        assert!(distributor.admin == admin_addr, E_NOT_ADMIN);

        let pool = RewardPool {
            vault_address,
            rewards_per_second,
            total_staked: 0,
            acc_rewards_per_share: 0,
            last_reward_time: timestamp::now_seconds(),
            end_time: timestamp::now_seconds() + duration_seconds,
            is_active: true,
        };

        table::add(&mut distributor.pools, vault_address, pool);
    }

    /// Stake vault shares to earn rewards
    public entry fun stake(
        user: &signer,
        distributor_addr: address,
        vault_address: address,
        amount: u64,
    ) acquires RewardsDistributor, RewardsEvents {
        let user_addr = signer::address_of(user);
        let distributor = borrow_global_mut<RewardsDistributor>(distributor_addr);

        assert!(table::contains(&distributor.pools, vault_address), E_POOL_NOT_FOUND);

        let pool = table::borrow_mut(&mut distributor.pools, vault_address);

        if (!table::contains(&distributor.user_info, user_addr)) {
            table::add(&mut distributor.user_info, user_addr, table::new());
        };

        let user_pools = table::borrow_mut(&mut distributor.user_info, user_addr);

        if (!table::contains(user_pools, vault_address)) {
            table::add(user_pools, vault_address, UserRewardInfo {
                amount: 0,
                reward_debt: 0,
                pending_rewards: 0,
                total_claimed: 0,
            });
        };

        let user_info = table::borrow_mut(user_pools, vault_address);

        if (user_info.amount > 0) {
            let pending = (user_info.amount * pool.acc_rewards_per_share) / distributor.precision - user_info.reward_debt;
            user_info.pending_rewards = user_info.pending_rewards + pending;
        };

        user_info.amount = user_info.amount + amount;
        user_info.reward_debt = (user_info.amount * pool.acc_rewards_per_share) / distributor.precision;
        pool.total_staked = pool.total_staked + amount;

        let events = borrow_global_mut<RewardsEvents>(distributor_addr);
        event::emit_event(&mut events.stake_events, StakeEvent {
            user: user_addr,
            pool: vault_address,
            amount,
            is_stake: true,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Unstake vault shares
    public entry fun unstake(
        user: &signer,
        distributor_addr: address,
        vault_address: address,
        amount: u64,
    ) acquires RewardsDistributor, RewardsEvents {
        let user_addr = signer::address_of(user);
        let distributor = borrow_global_mut<RewardsDistributor>(distributor_addr);

        assert!(table::contains(&distributor.pools, vault_address), E_POOL_NOT_FOUND);

        let pool = table::borrow_mut(&mut distributor.pools, vault_address);
        let user_pools = table::borrow_mut(&mut distributor.user_info, user_addr);
        let user_info = table::borrow_mut(user_pools, vault_address);

        let pending = (user_info.amount * pool.acc_rewards_per_share) / distributor.precision - user_info.reward_debt;
        user_info.pending_rewards = user_info.pending_rewards + pending;

        user_info.amount = user_info.amount - amount;
        user_info.reward_debt = (user_info.amount * pool.acc_rewards_per_share) / distributor.precision;
        pool.total_staked = pool.total_staked - amount;

        let events = borrow_global_mut<RewardsEvents>(distributor_addr);
        event::emit_event(&mut events.stake_events, StakeEvent {
            user: user_addr,
            pool: vault_address,
            amount,
            is_stake: false,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Claim pending rewards
    public entry fun claim(
        user: &signer,
        distributor_addr: address,
        vault_address: address,
    ) acquires RewardsDistributor, FlowCapabilities, RewardsEvents {
        let user_addr = signer::address_of(user);
        let distributor = borrow_global_mut<RewardsDistributor>(distributor_addr);

        assert!(table::contains(&distributor.pools, vault_address), E_POOL_NOT_FOUND);

        let pool = table::borrow(&distributor.pools, vault_address);
        let user_pools = table::borrow_mut(&mut distributor.user_info, user_addr);
        let user_info = table::borrow_mut(user_pools, vault_address);

        let pending = (user_info.amount * pool.acc_rewards_per_share) / distributor.precision - user_info.reward_debt;
        let total_rewards = user_info.pending_rewards + pending;

        assert!(total_rewards > 0, E_NO_REWARDS);

        let caps = borrow_global<FlowCapabilities>(distributor_addr);
        let reward_coins = coin::mint(total_rewards, &caps.mint_cap);

        if (!coin::is_account_registered<FLOW>(user_addr)) {
            coin::register<FLOW>(user);
        };

        coin::deposit(user_addr, reward_coins);

        user_info.pending_rewards = 0;
        user_info.reward_debt = (user_info.amount * pool.acc_rewards_per_share) / distributor.precision;
        user_info.total_claimed = user_info.total_claimed + total_rewards;

        let distributor_mut = borrow_global_mut<RewardsDistributor>(distributor_addr);
        distributor_mut.total_distributed = distributor_mut.total_distributed + total_rewards;

        let events = borrow_global_mut<RewardsEvents>(distributor_addr);
        event::emit_event(&mut events.claim_events, ClaimEvent {
            user: user_addr,
            pool: vault_address,
            amount: total_rewards,
            timestamp: timestamp::now_seconds(),
        });
    }

    // ============ View Functions ============

    #[view]
    public fun get_pending_rewards(
        distributor_addr: address,
        user_addr: address,
        vault_address: address,
    ): u64 acquires RewardsDistributor {
        let distributor = borrow_global<RewardsDistributor>(distributor_addr);

        if (!table::contains(&distributor.pools, vault_address)) {
            return 0
        };

        if (!table::contains(&distributor.user_info, user_addr)) {
            return 0
        };

        let pool = table::borrow(&distributor.pools, vault_address);
        let user_pools = table::borrow(&distributor.user_info, user_addr);

        if (!table::contains(user_pools, vault_address)) {
            return 0
        };

        let user_info = table::borrow(user_pools, vault_address);
        let pending = (user_info.amount * pool.acc_rewards_per_share) / distributor.precision - user_info.reward_debt;
        user_info.pending_rewards + pending
    }

    #[view]
    public fun get_total_distributed(distributor_addr: address): u64 acquires RewardsDistributor {
        let distributor = borrow_global<RewardsDistributor>(distributor_addr);
        distributor.total_distributed
    }
}
