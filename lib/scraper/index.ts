import axios from "axios";
import * as cheerio from 'cheerio';
import { extractCurrency, extractDescription, extractPrice } from "../utlis";

export async function scrapeWebsiteProduct(url: string) {
    if (!url) return;

    // BrightData proxy configuration
    const username = String(process.env.BRIGHT_DATA_USERNAME);
    const password = String(process.env.BRIGHT_DATA_PASSWORD);
    const port = 22225;
    const session_id = (1000000 * Math.random()) | 0;

    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password,
        },

        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
    }

    try {
        // Fetch the product page
        const response = await axios.get(url, options);

        // console.log(response.data);
        const $ = cheerio.load(response.data);

        const title1 = $('#productTitle').text().trim();
        const title2 = $('span.B_NuCI').text().trim();

        const title = (title1.length > 0) ? title1 : title2;

        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'), // amazon
            $('a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
            $('._30jeq3._16Jk6d'), // flipkart
        );

        const originalPrice = extractPrice(
            $('#priceblock_ourprice'), // amazon
            $('.a-price.a-text-price span.a-offscreen'),
            $('.a-offscreen'),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price'),
            $('._3I9_wc._2p6lqe') // flipkart
        );

        const outOfStock = $('#availability span').text().trim().toLowerCase() == 'currently unavailable';

        const images =
            $('#imgBlkFront').attr('data-a-dynamic-image') ||
            $('#landingImage').attr('data-a-dynamic-image') ||
            '{}';

        const imageUrls = Object.keys(JSON.parse(images));

        const currency = extractCurrency($('.a-price-symbol'));
        const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "");

        const description = extractDescription($);

        // console.log({ title, currentPrice, originalPrice, outOfStock, imageUrls, currency, discountRate });
        // Construct data object with scraped information
        const data = {
            url,
            currency: currency || '₹',
            image: imageUrls[0],
            title,
            currentPrice: Number(currentPrice) || Number(originalPrice),
            originalPrice: Number(originalPrice) || Number(currentPrice),
            priceHistory: [],
            discountRate: Number(discountRate),
            category: 'category',
            reviewsCount: 150,
            stars: 4.4,
            isOutOfStock: outOfStock,
            description,
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(originalPrice) || Number(currentPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice),
        }

        // console.log(data);
        return data;
    } catch (error: any) {
        throw new Error(`Failed to scrape product: ${error.message}`)
    }
}