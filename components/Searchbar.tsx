"use client";

import { scrapeAndStoreProduct } from '@/lib/actions';
import React, { FormEvent, useState } from 'react'

const isValidURL = (url: string) => {
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname;

    // check if hostname contains amazon.com or flipkart.com or amazon.in (country code)
    if(hostname.includes("amazon.com") || 
      hostname.includes("amazon.") || 
      hostname.endsWith("amazon") ||
      hostname.includes("flipkart.com") ||
      hostname.includes("flipkart.") ||
      hostname.endsWith("flipkart")) {
        // valid amazon or flipkart url
        return true;
      }

  } catch (error) {
      return false;
  }

  return false;
}

const Searchbar = () => {

    const [searchPrompt, setSearchPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault(); // prevents reload when submit button is clicked

      const isValidLink = isValidURL(searchPrompt);

      if(!isValidLink) return alert('Please provide a valid link')

      try {
        setIsLoading(true);
        
        // scrape the product page
        const product = await scrapeAndStoreProduct(searchPrompt);
      } catch (error) {
          console.log(error);
          
      } finally {
        setIsLoading(false);
      }
    }

  return (
    <form 
    className='flex flex-wrap gap-4 mt-12'
    onSubmit={handleSubmit}
    >
        <input
            type='text'
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            placeholder='Enter product link'
            className='searchbar-input'
        />

        <button 
          type='submit' 
          className='searchbar-btn' 
          disabled={searchPrompt === ''}
        >
            {isLoading ? 'Searching...' : 'Search'}
        </button>
    </form>
  )
}

export default Searchbar;