// radical-shoots-kg.js
// Radical Shoots Customer Segment Knowledge Graph

const RadicalShootsKG = {
  nodes: [
    // Customer Segments
    {
      id: "home-cooks",
      label: "Home Cooks",
      type: "segment",
      properties: {
        size: 1200,
        ltv: "$$",
        description: "Health-conscious Nashville families cooking at home",
        metrics: {
          avgOrderValue: 45,
          frequency: "monthly",
          retention: 0.65
        },
        centrality: 0.75
      }
    },
    {
      id: "chefs-restaurants",
      label: "Chefs & Restaurants", 
      type: "segment",
      properties: {
        size: 150,
        ltv: "$$$",
        description: "Nashville fine dining and farm-to-table establishments",
        metrics: {
          avgOrderValue: 180,
          frequency: "weekly",
          retention: 0.85
        },
        centrality: 0.90
      }
    },
    {
      id: "farmers-market",
      label: "Farmers Market Shoppers",
      type: "segment", 
      properties: {
        size: 800,
        ltv: "$$",
        description: "Weekly market regulars who value local sourcing",
        metrics: {
          avgOrderValue: 35,
          frequency: "weekly",
          retention: 0.70
        },
        centrality: 0.80
      }
    },
    {
      id: "health-wellness",
      label: "Health & Wellness",
      type: "segment",
      properties: {
        size: 950,
        ltv: "$$",
        description: "Juice bars, yoga studios, functional food enthusiasts",
        metrics: {
          avgOrderValue: 55,
          frequency: "bi-weekly", 
          retention: 0.75
        },
        centrality: 0.70
      }
    },
    {
      id: "gift-givers",
      label: "Gift Givers",
      type: "segment",
      properties: {
        size: 600,
        ltv: "$",
        description: "Curated food boxes, holiday and hostess gifts",
        metrics: {
          avgOrderValue: 65,
          frequency: "seasonal",
          retention: 0.40
        },
        centrality: 0.45
      }
    },
    {
      id: "instagram-foodies",
      label: "Instagram Foodies",
      type: "segment",
      properties: {
        size: 400,
        ltv: "$$",
        description: "Content creators and food bloggers",
        metrics: {
          avgOrderValue: 40,
          frequency: "monthly",
          retention: 0.60
        },
        centrality: 0.85
      }
    },
    {
      id: "csa-subscribers",
      label: "CSA/Subscription",
      type: "segment",
      properties: {
        size: 300,
        ltv: "$$$",
        description: "Weekly box and pre-order regulars",
        metrics: {
          avgOrderValue: 75,
          frequency: "weekly",
          retention: 0.90
        },
        centrality: 0.60
      }
    },
    {
      id: "specialty-grocers",
      label: "Specialty Grocers",
      type: "segment",
      properties: {
        size: 25,
        ltv: "$$$",
        description: "Local shops, co-ops, Turnip Truck type stores",
        metrics: {
          avgOrderValue: 200,
          frequency: "bi-weekly",
          retention: 0.80
        },
        centrality: 0.65
      }
    },

    // Products
    {
      id: "microgreens",
      label: "Microgreens",
      type: "product",
      properties: {
        size: 800,
        margin: "high",
        description: "Fresh microgreens for garnish and nutrition",
        shelfLife: "7 days"
      }
    },
    {
      id: "artisan-cheese",
      label: "Artisan Cheese",
      type: "product", 
      properties: {
        size: 600,
        margin: "medium",
        description: "Handcrafted local cheese varieties",
        shelfLife: "30 days"
      }
    },
    {
      id: "raw-honey",
      label: "Raw Honey",
      type: "product",
      properties: {
        size: 700,
        margin: "high", 
        description: "Unprocessed local wildflower honey",
        shelfLife: "indefinite"
      }
    },
    {
      id: "maple-syrup",
      label: "Maple Syrup",
      type: "product",
      properties: {
        size: 500,
        margin: "medium",
        description: "Pure Tennessee maple syrup",
        shelfLife: "2 years"
      }
    },
    {
      id: "gourmet-mushrooms",
      label: "Gourmet Mushrooms", 
      type: "product",
      properties: {
        size: 600,
        margin: "high",
        description: "Specialty mushroom varieties",
        shelfLife: "10 days"
      }
    },

    // Acquisition Channels
    {
      id: "instagram",
      label: "Instagram",
      type: "channel",
      properties: {
        size: 300,
        cost: "low",
        reach: "high"
      }
    },
    {
      id: "farmers-markets",
      label: "Farmers Markets", 
      type: "channel",
      properties: {
        size: 400,
        cost: "medium",
        reach: "medium"
      }
    },
    {
      id: "word-of-mouth",
      label: "Word of Mouth",
      type: "channel",
      properties: {
        size: 350,
        cost: "none",
        reach: "high"
      }
    },
    {
      id: "chef-networks",
      label: "Chef Networks",
      type: "channel", 
      properties: {
        size: 200,
        cost: "low",
        reach: "medium"
      }
    },
    {
      id: "google-search",
      label: "Google Search",
      type: "channel",
      properties: {
        size: 250,
        cost: "medium", 
        reach: "medium"
      }
    }
  ],

  edges: [
    // Purchase Affinity - Segments to Products
    {source: "home-cooks", target: "raw-honey", type: "purchase_affinity", weight: 9},
    {source: "home-cooks", target: "maple-syrup", type: "purchase_affinity", weight: 8},
    {source: "home-cooks", target: "artisan-cheese", type: "purchase_affinity", weight: 6},
    {source: "home-cooks", target: "microgreens", type: "purchase_affinity", weight: 4},
    {source: "home-cooks", target: "gourmet-mushrooms", type: "purchase_affinity", weight: 5},

    {source: "chefs-restaurants", target: "microgreens", type: "purchase_affinity", weight: 10},
    {source: "chefs-restaurants", target: "gourmet-mushrooms", type: "purchase_affinity", weight: 9},
    {source: "chefs-restaurants", target: "artisan-cheese", type: "purchase_affinity", weight: 7},
    {source: "chefs-restaurants", target: "raw-honey", type: "purchase_affinity", weight: 5},
    {source: "chefs-restaurants", target: "maple-syrup", type: "purchase_affinity", weight: 4},

    {source: "farmers-market", target: "raw-honey", type: "purchase_affinity", weight: 9},
    {source: "farmers-market", target: "maple-syrup", type: "purchase_affinity", weight: 8},
    {source: "farmers-market", target: "artisan-cheese", type: "purchase_affinity", weight: 7},
    {source: "farmers-market", target: "microgreens", type: "purchase_affinity", weight: 6},
    {source: "farmers-market", target: "gourmet-mushrooms", type: "purchase_affinity", weight: 6},

    {source: "health-wellness", target: "microgreens", type: "purchase_affinity", weight: 10},
    {source: "health-wellness", target: "raw-honey", type: "purchase_affinity", weight: 7},
    {source: "health-wellness", target: "gourmet-mushrooms", type: "purchase_affinity", weight: 6},
    {source: "health-wellness", target: "artisan-cheese", type: "purchase_affinity", weight: 3},
    {source: "health-wellness", target: "maple-syrup", type: "purchase_affinity", weight: 4},

    {source: "gift-givers", target: "raw-honey", type: "purchase_affinity", weight: 9},
    {source: "gift-givers", target: "maple-syrup", type: "purchase_affinity", weight: 8},
    {source: "gift-givers", target: "artisan-cheese", type: "purchase_affinity", weight: 8},
    {source: "gift-givers", target: "microgreens", type: "purchase_affinity", weight: 2},
    {source: "gift-givers", target: "gourmet-mushrooms", type: "purchase_affinity", weight: 4},

    {source: "instagram-foodies", target: "microgreens", type: "purchase_affinity", weight: 9},
    {source: "instagram-foodies", target: "gourmet-mushrooms", type: "purchase_affinity", weight: 8},
    {source: "instagram-foodies", target: "artisan-cheese", type: "purchase_affinity", weight: 6},
    {source: "instagram-foodies", target: "raw-honey", type: "purchase_affinity", weight: 5},
    {source: "instagram-foodies", target: "maple-syrup", type: "purchase_affinity", weight: 4},

    {source: "csa-subscribers", target: "microgreens", type: "purchase_affinity", weight: 8},
    {source: "csa-subscribers", target: "artisan-cheese", type: "purchase_affinity", weight: 8},
    {source: "csa-subscribers", target: "raw-honey", type: "purchase_affinity", weight: 7},
    {source: "csa-subscribers", target: "gourmet-mushrooms", type: "purchase_affinity", weight: 7},
    {source: "csa-subscribers", target: "maple-syrup", type: "purchase_affinity", weight: 6},

    {source: "specialty-grocers", target: "microgreens", type: "purchase_affinity", weight: 8},
    {source: "specialty-grocers", target: "artisan-cheese", type: "purchase_affinity", weight: 7},
    {source: "specialty-grocers", target: "gourmet-mushrooms", type: "purchase_affinity", weight: 7},
    {source: "specialty-grocers", target: "raw-honey", type: "purchase_affinity", weight: 6},
    {source: "specialty-grocers", target: "maple-syrup", type: "purchase_affinity", weight: 6},

    // Cross-sell Potential - Segment to Segment
    {source: "farmers-market", target: "home-cooks", type: "cross_sell", weight: 8},
    {source: "instagram-foodies", target: "health-wellness", type: "cross_sell", weight: 7},
    {source: "home-cooks", target: "csa-subscribers", type: "cross_sell", weight: 6},
    {source: "gift-givers", target: "farmers-market", type: "cross_sell", weight: 5},
    {source: "health-wellness", target: "home-cooks", type: "cross_sell", weight: 7},
    {source: "chefs-restaurants", target: "specialty-grocers", type: "cross_sell", weight: 9},

    // Content Generation - Segments that create UGC
    {source: "instagram-foodies", target: "instagram", type: "content_gen", weight: 10},
    {source: "chefs-restaurants", target: "instagram", type: "content_gen", weight: 8},
    {source: "home-cooks", target: "word-of-mouth", type: "content_gen", weight: 7},
    {source: "farmers-market", target: "word-of-mouth", type: "content_gen", weight: 8},
    {source: "health-wellness", target: "instagram", type: "content_gen", weight: 6},

    // Acquisition Channels to Segments
    {source: "instagram", target: "instagram-foodies", type: "acquisition", weight: 9},
    {source: "instagram", target: "health-wellness", type: "acquisition", weight: 7},
    {source: "instagram", target: "home-cooks", type: "acquisition", weight: 6},

    {source: "farmers-markets", target: "farmers-market", type: "acquisition", weight: 10},
    {source: "farmers-markets", target: "home-cooks", type: "acquisition", weight: 8},
    {source: "farmers-markets", target: "gift-givers", type: "acquisition", weight: 7},

    {source: "word-of-mouth", target: "home-cooks", type: "acquisition", weight: 8},
    {source: "word-of-mouth", target: "farmers-market", type: "acquisition", weight: 7},
    {source: "word-of-mouth", target: "health-wellness", type: "acquisition", weight: 6},

    {source: "chef-networks", target: "chefs-restaurants", type: "acquisition", weight: 10},
    {source: "chef-networks", target: "specialty-grocers", type: "acquisition", weight: 8},

    {source: "google-search", target: "home-cooks", type: "acquisition", weight: 7},
    {source: "google-search", target: "health-wellness", type: "acquisition", weight: 6},
    {source: "google-search", target: "csa-subscribers", type: "acquisition", weight: 5}
  ],

  metadata: {
    created: "2026-03-25",
    version: "1.0", 
    description: "Customer and consumer segment knowledge graph for Radical Shoots",
    totalAddressableSegments: 8,
    highestLtvSegment: "chefs-restaurants",
    strongestCrossSellPair: "farmers-market → home-cooks",
    bestUgcSegment: "instagram-foodies"
  },

  // Computed Properties
  computedProperties: {
    segmentCentralityScores: {
      "chefs-restaurants": 0.90,
      "instagram-foodies": 0.85,
      "farmers-market": 0.80,
      "home-cooks": 0.75,
      "health-wellness": 0.70,
      "specialty-grocers": 0.65,
      "csa-subscribers": 0.60,
      "gift-givers": 0.45
    },

    productSegmentAffinityMatrix: {
      microgreens: {"chefs-restaurants": 10, "health-wellness": 10, "instagram-foodies": 9},
      "raw-honey": {"home-cooks": 9, "farmers-market": 9, "gift-givers": 9},
      "gourmet-mushrooms": {"chefs-restaurants": 9, "instagram-foodies": 8},
      "maple-syrup": {"home-cooks": 8, "farmers-market": 8, "gift-givers": 8},
      "artisan-cheese": {"gift-givers": 8, "csa-subscribers": 8}
    },

    crossSellProbabilityMatrix: {
      "farmers-market": {"home-cooks": 0.35, "csa-subscribers": 0.20},
      "instagram-foodies": {"health-wellness": 0.30, "home-cooks": 0.25},
      "health-wellness": {"home-cooks": 0.30, "farmers-market": 0.20},
      "chefs-restaurants": {"specialty-grocers": 0.40}
    },

    recommendedAcquisitionStrategies: {
      "home-cooks": ["word-of-mouth", "farmers-markets", "google-search"],
      "chefs-restaurants": ["chef-networks", "instagram", "word-of-mouth"],
      "farmers-market": ["farmers-markets", "word-of-mouth"],
      "health-wellness": ["instagram", "google-search", "word-of-mouth"],
      "gift-givers": ["farmers-markets", "instagram", "google-search"],
      "instagram-foodies": ["instagram", "chef-networks"],
      "csa-subscribers": ["google-search", "word-of-mouth", "farmers-markets"],
      "specialty-grocers": ["chef-networks", "word-of-mouth"]
    }
  }
};

// Export for Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RadicalShootsKG;
} else if (typeof window !== 'undefined') {
  window.RadicalShootsKG = RadicalShootsKG;
}