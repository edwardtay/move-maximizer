/// MoveFlow Strategy Router - Routes funds to different DeFi protocols
module moveflow::strategy_router {
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_PROTOCOL_NOT_FOUND: u64 = 2;
    const E_INVALID_ALLOCATION: u64 = 5;

    /// Protocol configuration
    struct ProtocolConfig has store, drop, copy {
        name: String,
        protocol_type: u8,
        protocol_address: address,
        is_active: bool,
        current_apy: u64,
        total_deposited: u64,
        risk_score: u8,
    }

    /// Router state
    struct StrategyRouter<phantom CoinType> has key {
        admin: address,
        protocols: vector<ProtocolConfig>,
        total_routed: u64,
        auto_rebalance: bool,
        rebalance_threshold: u64,
        last_rebalance: u64,
        signer_cap: account::SignerCapability,
    }

    /// Allocation target for a protocol
    struct AllocationTarget has store, drop, copy {
        protocol_index: u64,
        target_bps: u64,
    }

    /// Current allocations state
    struct Allocations<phantom CoinType> has key {
        targets: vector<AllocationTarget>,
        total_allocation_bps: u64,
    }

    /// Events
    struct RouterEvents<phantom CoinType> has key {
        protocol_events: EventHandle<ProtocolUpdateEvent>,
    }

    struct ProtocolUpdateEvent has drop, store {
        protocol_name: String,
        old_apy: u64,
        new_apy: u64,
        timestamp: u64,
    }

    /// Initialize the strategy router
    public entry fun initialize<CoinType>(
        admin: &signer,
        rebalance_threshold: u64,
    ) {
        let admin_addr = signer::address_of(admin);

        let (router_signer, signer_cap) = account::create_resource_account(admin, b"moveflow_router");
        coin::register<CoinType>(&router_signer);

        move_to(admin, StrategyRouter<CoinType> {
            admin: admin_addr,
            protocols: vector::empty(),
            total_routed: 0,
            auto_rebalance: true,
            rebalance_threshold,
            last_rebalance: timestamp::now_seconds(),
            signer_cap,
        });

        move_to(admin, Allocations<CoinType> {
            targets: vector::empty(),
            total_allocation_bps: 0,
        });

        move_to(admin, RouterEvents<CoinType> {
            protocol_events: account::new_event_handle<ProtocolUpdateEvent>(admin),
        });
    }

    /// Add a new protocol to the router
    public entry fun add_protocol<CoinType>(
        admin: &signer,
        router_addr: address,
        name: String,
        protocol_type: u8,
        protocol_address: address,
        initial_apy: u64,
        risk_score: u8,
    ) acquires StrategyRouter {
        let admin_addr = signer::address_of(admin);
        let router = borrow_global_mut<StrategyRouter<CoinType>>(router_addr);

        assert!(router.admin == admin_addr, E_NOT_AUTHORIZED);

        let protocol = ProtocolConfig {
            name,
            protocol_type,
            protocol_address,
            is_active: true,
            current_apy: initial_apy,
            total_deposited: 0,
            risk_score,
        };

        vector::push_back(&mut router.protocols, protocol);
    }

    /// Set allocation targets for protocols
    public entry fun set_allocations<CoinType>(
        admin: &signer,
        router_addr: address,
        protocol_indices: vector<u64>,
        target_bps_list: vector<u64>,
    ) acquires StrategyRouter, Allocations {
        let admin_addr = signer::address_of(admin);
        let router = borrow_global<StrategyRouter<CoinType>>(router_addr);

        assert!(router.admin == admin_addr, E_NOT_AUTHORIZED);
        assert!(vector::length(&protocol_indices) == vector::length(&target_bps_list), E_INVALID_ALLOCATION);

        let allocations = borrow_global_mut<Allocations<CoinType>>(router_addr);
        allocations.targets = vector::empty();
        allocations.total_allocation_bps = 0;

        let i = 0;
        let len = vector::length(&protocol_indices);
        while (i < len) {
            let idx = *vector::borrow(&protocol_indices, i);
            let target = *vector::borrow(&target_bps_list, i);

            assert!(idx < vector::length(&router.protocols), E_PROTOCOL_NOT_FOUND);

            vector::push_back(&mut allocations.targets, AllocationTarget {
                protocol_index: idx,
                target_bps: target,
            });

            allocations.total_allocation_bps = allocations.total_allocation_bps + target;
            i = i + 1;
        };

        assert!(allocations.total_allocation_bps <= 10000, E_INVALID_ALLOCATION);
    }

    /// Update protocol APY
    public entry fun update_protocol_apy<CoinType>(
        _caller: &signer,
        router_addr: address,
        protocol_index: u64,
        new_apy: u64,
    ) acquires StrategyRouter, RouterEvents {
        let router = borrow_global_mut<StrategyRouter<CoinType>>(router_addr);

        assert!(protocol_index < vector::length(&router.protocols), E_PROTOCOL_NOT_FOUND);

        let protocol = vector::borrow_mut(&mut router.protocols, protocol_index);
        let old_apy = protocol.current_apy;
        protocol.current_apy = new_apy;

        let events = borrow_global_mut<RouterEvents<CoinType>>(router_addr);
        event::emit_event(&mut events.protocol_events, ProtocolUpdateEvent {
            protocol_name: protocol.name,
            old_apy,
            new_apy,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Toggle protocol active status
    public entry fun toggle_protocol<CoinType>(
        admin: &signer,
        router_addr: address,
        protocol_index: u64,
    ) acquires StrategyRouter {
        let admin_addr = signer::address_of(admin);
        let router = borrow_global_mut<StrategyRouter<CoinType>>(router_addr);

        assert!(router.admin == admin_addr, E_NOT_AUTHORIZED);
        assert!(protocol_index < vector::length(&router.protocols), E_PROTOCOL_NOT_FOUND);

        let protocol = vector::borrow_mut(&mut router.protocols, protocol_index);
        protocol.is_active = !protocol.is_active;
    }

    /// Enable/disable auto rebalancing
    public entry fun set_auto_rebalance<CoinType>(
        admin: &signer,
        router_addr: address,
        enabled: bool,
    ) acquires StrategyRouter {
        let admin_addr = signer::address_of(admin);
        let router = borrow_global_mut<StrategyRouter<CoinType>>(router_addr);

        assert!(router.admin == admin_addr, E_NOT_AUTHORIZED);
        router.auto_rebalance = enabled;
    }

    // ============ View Functions ============

    #[view]
    public fun get_router_info<CoinType>(router_addr: address): (u64, u64, bool, u64) acquires StrategyRouter {
        let router = borrow_global<StrategyRouter<CoinType>>(router_addr);
        (
            router.total_routed,
            vector::length(&router.protocols),
            router.auto_rebalance,
            router.last_rebalance
        )
    }

    #[view]
    public fun get_protocol_info<CoinType>(
        router_addr: address,
        protocol_index: u64
    ): (String, u8, bool, u64, u64, u8) acquires StrategyRouter {
        let router = borrow_global<StrategyRouter<CoinType>>(router_addr);
        let protocol = vector::borrow(&router.protocols, protocol_index);
        (
            protocol.name,
            protocol.protocol_type,
            protocol.is_active,
            protocol.current_apy,
            protocol.total_deposited,
            protocol.risk_score
        )
    }
}
