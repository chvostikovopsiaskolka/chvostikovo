# Customer v373 / Beta 2.0.48

Restores white translucent information cards over the pink/blue outer panel; information aligns left. Stops flex/grid stretching the information rows when one dog has no photo. Each photo button owns a square slot and its picture fills that slot, including the no-photo fallback. Existing photo nodes and handlers remain unchanged. Names follow the corrected IMG_2209(1) reference: centered content-width white plaques with a pink/blue border, overlapping the lower photo edge, slightly larger20px text. No full-width pink strip.

Baseline0de15fe52fb1412d1650331f60af394df68b4518/tree dc4e9a360778c0b1befd97aaecb694de25ec4460; backup/customer-before-dual-white-v373-20261024. Selective revert after later releases; no data rollback. Full CI and mixed real-photo/placeholder browser matrix required. One-dog layout, navigation, business logic, API and database unchanged. Physical phones remain unverified.
