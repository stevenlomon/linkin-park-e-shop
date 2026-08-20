(pasted from my Obsidian)

# Database Diagram

Price in the Product table? This can be tricky. I think we're gonna end up with something along the lines of current_price and standard_price. Let's start with that in the Product Table

As I'm mapping out this db table, take a look at the real Linkin Park store!

SHOP BY ALBUM! I LOVE THAT. I need to implement that

Right, so still in the Product Table, I'm thinking that `category` is essentially an Enum that can be.. clothing, music..  
Looking in the merch section..  
We need to allow category to also be `accesory`, `poster`, and... `special`.  
We don't need to have a `drinkware` category if the only drinkware is `mug`  
Let's just have a `special` type that itself has the sub-categories `mug`, `notebook`, etc. etc. One-off merch things! This feels good  

Sub-category can either be `NULL`, all sub-categories within `clothing`, all sub-categories within `music`, potential sub-categories within `accessory`, and also `poster`. So this one can be `NULL`! `category_id` in `Product` can't!  

This is good enough to get us going!  

What do we need more than Product?  

Do we.. need a DB Table for Cart? We do.. don't we? SINCE "- Varukorgen ska sparas ner i databasen istället för att endast ha den i react"  

A Cart can have many products... and a product should be able to exist in several carts at the same time. It's many-to-many  
A User only has one Cart. And a Cart can only belong to one User. This is one-to-one. The most logical for me.. is to have the Cart table have a user_id. The Cart *belongs* to the User  

I want the upcoming Unshatter to a central focal point of the site. The timing is immaculate. Good time to be a Linkin Park fan  

![db diagram v1.1](./db_schemas/Linkin%20Park%20E-store%20DB%20Diagram%20v1.1.drawio.png)  

That's 30 min.  
Next 30 min: Sitemap (pretty much already done) -> Endpoints -> Time plan  

Alright. 

Final refinement for v1: A self-referencing Category table, which apparently is industry standard. It makes intuitive sense! In the Category table, we have a row called parent_id. If a category has NULL in this row, it's a main category (e.g. `music`, `clothing`, etc etc.) If it *has* a value, it's a sub-category, completely eliminating the need for a Sub-Category table! For example, there can be a row in the Category table called `hoodie` with `parent_id` being the id of `clothing` in the same table!  

For the Order table..  
I'm considering whether to connect Order to Cart or User..  
A user can have many orders but an order can only belong to one user. It's the go-to example when learning about cardinality.  
But isn't it more efficient to connect it to the Cart? This makes it easy to see exactly which products were ordered and we can easily go from Cart to User. I'm going with my gut feeling, I'm connecting it to Cart.  

![db diagram v1.3](./db_schemas/Linkin%20Park%20E-store%20DB%20Diagram%20v1.3.drawio.png)

This is not to be recommended for three main reasons:  
1. If we connect Order to Cart via cart_id, when we empty the customer's cart upon purchase and delete the rows in Carts_Products... all of a sudden our historical order that is supposed to be a snapshot in time of a cart becomes empty too  
2. If we reference the price via the Product table, it can never be a true snapshot in time  
3. If we reference the address via the User table, it can once again never be a true snapshot in time  

Final db that I'm okay continuing with:  
![db diagram v1.4](./db_schemas/Linkin%20Park%20E-store%20DB%20Diagram%20v1.4.drawio.png)  

# Sitemap
I reflected on this the other night  

/ HOME  
	/products -> calls /api/all-products and lists them  
	/products/:id -> detailed page view  
	/products/:id/edit (admin only)  
	/products/add (admin only)  
	/admin -> Simple admin dashboard  
	/checkout (dummy checkout)  
	/thank-you  
	/profile -> Simple user dashboard  
	/profile/orders -> calls orders from db where userId = ???  
	/admin/orders -> calls all orders from db  

Let's compare this to the real Linkin Park shop. 
https://store.linkinpark.com/products/from-zero-deluxe-ghostly-pink-2lp It... doesn't have /products/:id? Interesting  

And their broad product categories.. are collections:  
https://store.linkinpark.com/collections/vinyl  
https://store.linkinpark.com/collections/men  
Their Shop By Album feature is also simply a collection:  
https://store.linkinpark.com/collections/a-thousand-suns  

Right  
And their https://store.linkinpark.com/products/  
which the first instinct is to just make All Products lists all their collections. To *actually* see all products we go to   
https://store.linkinpark.com/collections/all  
Interesting.  
I think I'm just gonna make   
https://store.linkinpark.com/products/ list all products from the get-go  

There is no `/search`.. actually there is! Mmmm. There is a search icon in the top right which reveals a little search dropdown modal and there is *also* a `/search`. Right.   

And upon further inspection.. they use what I've come to call the Goodreads dropdown debounced search!  

There's a debounced API call *in* the search box with search results that are clickable and take you to the detailed view product page *or* you can click Enter and get to the search results page.   
And removing the query from this brings you to the same page.. without any results. An empty search page. Alright. I like this, I'm gonna do the same!  

They use https://store.linkinpark.com/account/login  
https://store.linkinpark.com/login leads to a 404 page  
Upon creating an account..  
https://store.linkinpark.com/account is what my intuition set as /profile.   
`/profile` or `/account`, they serve the same purpose  

https://store.linkinpark.com/admin takes you to a Shopify log in page, that's interesting. I see a pitching opportunity 👀  

# Endpoints
Let's quickly translate the sitemap and db diagram to endpoints  

**PRODUCTS ROUTER**  
GET `/products`  
GET `/products/:id`  
POST `/products/`  
PATCH `/products/:id/`  
Products won't have a DELETE endpoint, instead I'll add an `is_active` boolean row to the Product table -> v1.7  

**USERS ROUTER**  
GET `/users`  
GET `/users/:id`  
POST `/users`  
PATCH `/users/:id`  
DELETE `/users/:id`  

**ORDERS ROUTER**  
GET `/orders`  
GET `/orders/:id`  
POST `/orders`  
PATCH `/orders/:id`  
Even if a User is deleted from the database (which they have the right to have their user data wiped and deleted), we still keep the orders they've placed for bookkeeping?  

We can keep it this simple??  

It would seem so! Let's start with this!  