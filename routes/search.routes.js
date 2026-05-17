import express from "express";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query required",
      });
    }

    const country = req.query.country || "all";
    
    // Initialize promises as empty arrays
    let serpPromise = Promise.resolve([]);
    let darazPromise = Promise.resolve([]);

    // 1. Fetch SerpAPI Google Shopping if country is global or all
    if (country === "all" || country === "global") {
      serpPromise = (async () => {
        if (process.env.SERP_API_KEY && process.env.SERP_API_KEY !== "YOUR_SERP_API_KEY") {
          try {
            const url = new URL("https://serpapi.com/search.json");
            url.searchParams.append("engine", "google_shopping");
            url.searchParams.append("q", query);
            url.searchParams.append("api_key", process.env.SERP_API_KEY);

            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              return data.shopping_results?.map((item) => ({
                title: item.title,
                price: item.price,
                store: item.source,
                link: item.link,
                image: item.thumbnail,
              })) || [];
            }
          } catch (err) {
            console.log("SerpAPI failed:", err.message);
          }
        }
        return [];
      })();
    }

    // 2. Fetch Daraz BD Catalog if country is BD or all
    if (country === "all" || country === "BD") {
      darazPromise = (async () => {
        try {
          const darazUrl = `https://www.daraz.com.bd/catalog/?ajax=true&isFirstRequest=true&page=1&q=${encodeURIComponent(query)}`;
          const response = await fetch(darazUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0",
              "Accept": "application/json, text/plain, */*",
              "Accept-Language": "en-US,en;q=0.9",
              "Referer": "https://www.daraz.com.bd/",
              "X-CSRF-TOKEN": "51b436bbad76f",
              "Connection": "keep-alive",
              "Cookie": "__wpkreporterwid_=d1d37263-86df-4077-be98-58dba0f5b8e3; hng=BD|en-BD|BDT|050; userLanguageML=en; t_fv=1777660500974; t_uid=MOpa5CLsUXCHENGD04o4F5hSXc7W93zW; lwrid=AgGd5NKb81L2%2BGw8pOiivA129OG2; lzd_cid=f4825763-80ea-495a-aa19-55a5189b7477; tfstk=gfOmvb2dfKWjvirrtl5jEw5r9fkLcs11mhFOX1IZUgS7DoFv7NfMSh4OQm1vsLxMYiR261doIeL_6tu1MORkk3wvjFgf7G-wjGpxyXLXl11Zj1cK9EtMsDdMmiSVzV7GWRuR3iWGpSCZvDh-wGbYs189omTF4US5SZyVbhrP4wIP7-5wbgWP8wEV_1-Zr_7Ao-r4gZ8PaNSPb15wbz5PVN5Nbh5ZrUS57Uor3iOwaQoCqbGeqQhpgZXcYES4XldVKkIpu1VgsVKVnYYVq5rwadrupgjqdzI1MitAohGQGsWM3nbPsAU1mL8pMN-055YliLpdnLm4sgdvEQfvgcwByUjVK_p-FmBOinvCAtkSVHWHJpCXT0VFjK-Xf9OtASs27eOBp6cgasXN4lwzL7l81au9ZRwR3a_lvcWOJ3-Zuhd-r42E5t75lMdtrRyYA5PTF40uLAXVPZsV.; lwrtk=AAIEagm2iZdt3mIFISd1FJ3HpuO8CGH1lwmeQiKha8BTuLDfSbU95Ao=; _m_h5_tk=136624de153f4aed73e607d06b127cfe_1779000568332; _m_h5_tk_enc=a6f82957a70db8c051f1fcc4a3fe8b69; lzd_sid=1dbe6db06782a48cbd6adc1dfa97a979; _tb_token_=51b436bbad76f; EGG_SESS=S_Gs1wHo9OvRHCMp98md7F8tYbhgBSi6R1XBNboHimnS3i4UwDrkNcCBrEM9IGNe6X-Ecbbkh_1MIskkYYAuMzO2avtt7kK1_o7DVETWMvZLhlu_2Lb-KOvqdE-nRgmmlyCiDzTc01wYcUR1pDZwb-hTZV4sxqaT04KBg_M8raA=; __itrace_wid=88c075d8-3647-4bc6-81a8-64722277d7ba; t_sid=qH7pimLeOBtg0BDYnyNQPKvdeSjPWaJC; utm_channel=NA; epssw=12*rTOvRGtGGIEw2a5z8UizYg_mfJZhNOG2r0_Gt6XFGGGGGOoPMFvhMFshXBb3-krGGbeSQX2Sb1bUSoo6hLEmipqCcM2YZaOLNeWiW2Ny3DCcZs97G2CDrF4xmMOnQaj7jkjGoF4CjrwXSpIGGGGGxXlhz53assgz5he2RoDt-Gv2dO0-fJlRl7lmeycfGGG7hZZuWcHbIGOiySK0wbJ_VMeiGrONVkFHQCTGgGGVgItGtQlWgw8P2ISUQmOMRkuAFQpbJrPyP6d4cF2gu7kzP2FtK6dqOQZ1vsIztQEEmrI0Xn4WP%2BLI8qaa3kezke8cEonjYV-0bEnW53sUJG..",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin"
          }
        });

        if (response.ok) {
          const data = await response.json();
          const results = data.results || data.mods?.listItems || [];
          
          return results.map((item) => {
            const q = query.toLowerCase();
            let fallbackImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";
            if (q.includes("laptop") || q.includes("dell") || q.includes("hp") || q.includes("macbook") || q.includes("computer")) {
              fallbackImage = "https://images.unsplash.com/photo-1496181130204-755241544e35?w=400&q=80";
            } else if (q.includes("phone") || q.includes("iphone") || q.includes("samsung") || q.includes("pixel") || q.includes("mobile")) {
              fallbackImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80";
            } else if (q.includes("headphone") || q.includes("earphone") || q.includes("audio") || q.includes("sony")) {
              fallbackImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80";
            } else if (q.includes("shoes") || q.includes("nike") || q.includes("sneaker") || q.includes("adidas")) {
              fallbackImage = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80";
            } else if (q.includes("keyboard") || q.includes("mouse") || q.includes("keycap")) {
              fallbackImage = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80";
            }

            let directLink = "";
            if (item.itemUrl) {
              directLink = item.itemUrl.startsWith("http") ? item.itemUrl : `https:${item.itemUrl}`;
            } else {
              directLink = item.id ? `https://www.daraz.com.bd/products/-i${item.id}.html` : `https://www.daraz.com.bd/catalog/?q=${encodeURIComponent(query)}`;
            }

            let displayPrice = "Contact Seller";
            if (item.priceShow) {
              displayPrice = item.priceShow;
            } else if (item.price) {
              const numericPrice = Number(item.price);
              displayPrice = isNaN(numericPrice) ? item.price : `৳${numericPrice.toLocaleString()}`;
            }

            return {
              title: item.productName || item.name || "Product",
              price: displayPrice,
              store: item.storeName || "Daraz",
              link: directLink,
              image: item.image || fallbackImage,
            };
          });
        }
      } catch (err) {
        console.log("Daraz API failed:", err.message);
      }
      return [];
    })();
    }

    const [serpResults, darazResults] = await Promise.all([serpPromise, darazPromise]);
    const products = [...serpResults, ...darazResults];

    return res.json({
      success: true,
      query,
      total: products.length,
      products,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "API error",
    });
  }
});

export default router;