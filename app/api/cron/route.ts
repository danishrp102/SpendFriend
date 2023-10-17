import cron from "node-cron";
import Product from "@/lib/models/product.model";
import { connectToDB } from "@/lib/mongoose";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeWebsiteProduct } from "@/lib/scraper";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

export const maxDuration = 10; // 10 seconds allowed for vercel hobby version
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';


const task = cron.schedule('0 7 * * *', async () => {
    try {
        // async function GET(request: NextRequest) {
        // try {
        connectToDB();

        // const products = await Product.find({});
        const products = await Product.find();

        if (!products) throw new Error("No products found");

        // 1) scrape latest product details and update the db
        const updatedProducts = await Promise.all(
            products.map(async (currentProduct) => {
                const scrapedProduct = await scrapeWebsiteProduct(currentProduct.url);

                if (!scrapedProduct) throw new Error("No product found");

                const updatedPriceHistory: any = [
                    ...currentProduct.priceHistory,
                    { price: scrapedProduct.currentPrice },
                ]

                const product = {
                    ...scrapedProduct,
                    priceHistory: updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice: getAveragePrice(updatedPriceHistory),
                };

                const updatedProduct = await Product.findOneAndUpdate(
                    { url: product.url },
                    product,
                    // { upsert: true, new: true }
                );

                // 2) check the status of each product and send email accordingly

                const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct);

                if (emailNotifType && updatedProduct.users.length > 0) {
                    const productInfo = {
                        title: updatedProduct.title,
                        url: updatedProduct.url,
                    };

                    const emailContent = await generateEmailBody(productInfo, emailNotifType);

                    const userEmails = updatedProduct.users.map((user: any) => user.email);

                    await sendEmail(emailContent, userEmails);
                }

                return updatedProduct;
            })
        );

        return NextResponse.json({
            message: "Ok",
            data: updatedProducts,
        });
        // }
        // catch (error: any) {
        //     // console.log("Error in GET: ", error.message);
        //     throw new Error(`Error in GET: ${error.message}`);
        // }
        // }

        // console.log('Task is running...');
    } catch (error: any) {
        // console.error('Error in task: ', error);
        throw new Error(`Error in GET: ${error.message}`);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Indian Standard Time
});

task.start();