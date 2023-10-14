"use server"

import { getAllProducts } from '@/lib/actions';
import { Product } from '@/types';
import React, { useEffect, useState } from 'react'
import ProductCard from './ProductCard';

const Feed = async () => {

    const allProducts = await getAllProducts();

    // const [allProducts, setAllProducts] = useState<Product[]>([]);

    // const fetchProducts = async () => {
    //     const prods = await getAllProducts();
    //     return prods;
    // };

    // useEffect(() => {
    //     const fetchAllProducts = async () => {
    //     try {
    //         const prods = await fetchProducts();
    //         if(prods) {
    //         setAllProducts(prods);
    //         }
    //     } catch (error) {
    //         console.log("Error fetching products: ", error);
    //     }
    //     }

    //     fetchAllProducts();
    // }, []);

  return (
    <>
        {allProducts?.map((product: Product) => (
            <ProductCard key={product._id} product={product}/>
        ))}
    </>
  )
}

export default Feed