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

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.append("engine", "google_shopping");
    url.searchParams.append("q", query);
    url.searchParams.append("api_key", process.env.SERP_API_KEY);

    const response = await fetch(url);
    const data = await response.json();

    const products = data.shopping_results?.map((item) => ({
      title: item.title,
      price: item.price,
      store: item.source,   // 👈 THIS is the store name
      link: item.link,
      image: item.thumbnail,
    })) || [];

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