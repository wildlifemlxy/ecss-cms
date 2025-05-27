import requests
from django.conf import settings
import re
import math

class WooCommerceAPI:
    def __init__(self):
        self.base_url = settings.WOOCOMMERCE_API_URL
        self.auth = (settings.WOOCOMMERCE_CONSUMER_KEY, settings.WOOCOMMERCE_CONSUMER_SECRET)

    def get_nsa_products(self):
        all_products = []
        page = 1
        per_page = 100  # Maximum number of products per page for WooCommerce API

        while True:
            try:
                # Construct the API URL with pagination
                url = f"{self.base_url}products"
                params = {
                    'per_page': per_page,
                    'page': page
                }        
                # Make the API request
                response = requests.get(url, params=params, auth=self.auth)
                response.raise_for_status()  # Check for request errors

                # Parse the response as JSON
                products = response.json()
                if not products:
                    break  # Exit the loop if no products are returned
                # Filter products based on the criteria
                filtered_products = [
                    product for product in products
                    if product.get('status') == 'publish'
                    and 'categories' in product
                    and len(product['categories']) == 2
                    and product['categories'][1].get('name') == 'Tri-Love Elderly: NSA'
                ]
                # Add filtered products to the list
                all_products.extend(filtered_products)
                # Increment page to fetch next set of products
                page += 1
            except requests.exceptions.RequestException as e:
                # Handle any errors during the request
                print(f"Error while fetching products: {e}")
                break
        return all_products

    def get_ilp_products(self):
        """Fetch and filter ILP products from WooCommerce."""
        all_products = []
        page = 1
        per_page = 100  # Maximum number of products per page for WooCommerce API

        while True:
            try:
                # Construct the API URL with pagination
                url = f"{self.base_url}products"
                params = {
                    'per_page': per_page,
                    'page': page
                }
                
                # Make the API request
                response = requests.get(url, params=params, auth=self.auth)
                response.raise_for_status()  # Check for request errors

                # Parse the response as JSON
                products = response.json()

                if not products:
                    break  # Exit the loop if no products are returned

                # Filter products based on the criteria for ILP
                filtered_products = [
                    product for product in products
                    if product.get('status') == 'publish'
                    and 'categories' in product
                    and len(product['categories']) == 2
                    and product['categories'][1].get('name') == 'Tri-Love Elderly: ILP'
                ]

                # Add filtered products to the list
                all_products.extend(filtered_products)

                # Increment page to fetch next set of products
                page += 1

            except requests.exceptions.RequestException as e:
                # Handle any errors during the request
                print(f"Error while fetching products: {e}")
                break

        return all_products

    def getProductId(self, chinese, english, location):
        """Fetches the product ID by matching Chinese, English, and Location names from WooCommerce."""
        try:
            print("Get Product Id", chinese, english, location)
            page = 1
            all_products = []  # List to store product id and name pairs
            per_page = 100  # Number of products to fetch per page
            matched_product_id = None  # Variable to store matched product ID

            while True:
                # Fetch products for the current page
                url = f"{self.base_url}products"
                params = {
                    'per_page': per_page,
                    'page': page,
                }

                response = requests.get(url, params=params, auth=self.auth)
                response.raise_for_status()  # Ensure we raise an error for bad requests

                products = response.json()  # Get products from the response
                

                # If no products are returned, break the loop
                if not products:
                    break

                # Check each product and split by <br/> or <br />
                for product in products:
                    product_name = product['name']
                    split_name = re.split(r'<br\s*/?>', product_name)
                    #print("Name:", product_name)
                    

                    if len(split_name) == 3:
                        chinese_name = split_name[0].strip()  # Removes leading/trailing spaces
                        english_name = split_name[1].strip()
                        location_name = split_name[2].strip()
                        print(chinese_name, english_name, location_name)
                                            
                        # If the product matches the input chinese, english, and location, return the product ID
                        if chinese_name == chinese and english_name == english and location_name == location:
                            matched_product_id = product['id']
                            break  # Exit the loop if the product is found
                    
                    if len(split_name) == 2:
                        english_name = split_name[0].strip()
                        location_name = split_name[1].strip()
                        print(english_name, location_name)
                                            
                        # If the product matches the input chinese, english, and location, return the product ID
                        if english_name == english and location_name == location:
                            matched_product_id = product['id']
                            break  # Exit the loop if the product is found


                # If we found the matched product ID, stop fetching more pages
                if matched_product_id:
                    break

                page += 1  # Move to the next page

            # Return the matched product ID if found, otherwise None
            return {"id": matched_product_id, "exist": True}

        except requests.exceptions.RequestException as e:
            # Handle any errors during the request
            print(f"Error fetching products: {e}")
            return None

    def updateCourseQuantity(request, product_id, status):
        """
        Updates the product stock based on the product ID and the status.
        Arguments:
            - product_id: The ID of the product to update.
            - status: The status to update stock based on ("Cancelled", "Paid", "SkillsFuture Done").
        """
        try:
            # Fetch current product details
            url = f"{settings.WOOCOMMERCE_API_URL}products/{product_id}"
            auth = (settings.WOOCOMMERCE_CONSUMER_KEY, settings.WOOCOMMERCE_CONSUMER_SECRET)
            response = requests.get(url, auth=auth)
            response.raise_for_status()

            product = response.json()
            print("Updating Product Stock:", status)

            # Get the current stock quantity
            original_stock_quantity = product.get("stock_quantity", 0)
            new_stock_quantity = original_stock_quantity  # Start with current stock
            print("Current Stock Quantity:", new_stock_quantity)

            # Parse short description to find "vacancy"
            short_description = product.get("short_description", "")
            array = short_description.split("<p>")
            print("Short Description Array:", array)
            if array and array[0] == '':
                array.pop(0)  # Remove empty first entry

            # Extract the number of vacancies directly within this function
            vacancies_text = next(
                (item.replace("\n", "").replace("<b>", "").replace("</b>", "")
                for item in array if "vacancy" in item.lower()),
                ""
            ).split("<br />")[-1].strip()
            vacancies_text = vacancies_text.replace("</p>", "").strip()        

            print("Vacancies Text:", vacancies_text)

            # Extract actual vacancies number using a regex directly in this function
            vacancies_match = re.search(r'(\d+)\s*Vacancies', vacancies_text)
            if vacancies_match:
                vacancies =  math.ceil(int(vacancies_match.group(1))*1.5)
            else:
                vacancies = 0  # Return 0 if no vacancies are found

            print("Actual Vacancies:", vacancies)

            print(f"Processing status: {status}")

            # **Stock Update Logic**
            if status == "Withdrawn":
                if new_stock_quantity < vacancies:  # Only increase stock if it is below vacancies
                    print("Increase stock by 1")
                    new_stock_quantity += 1
                else:
                    print("Stock is full, no increase.")  # Prevent increase beyond vacancies

            elif status in ["Paid", "SkillsFuture Done", "Confirmed"]:
                if new_stock_quantity > 0:  # Only decrease if stock is greater than 0
                    print("Decrease stock by 1")
                    new_stock_quantity -= 1  
                else:
                    print("Stock is already 0, cannot decrease further.")  # Prevents negative stock

            print("Updated Stock Quantity:", new_stock_quantity)

            # Only update stock if it has changed
            update_data = {"stock_quantity": new_stock_quantity}
            update_response = requests.put(f"{settings.WOOCOMMERCE_API_URL}products/{product_id}",
                                            json=update_data, auth=auth)
            update_response.raise_for_status()

            return True  # Successfully updated stock

        except requests.exceptions.RequestException as e:
            print(f"Error updating product stock: {e}")
            return False

    def updatePortOver(request, product_id):
            """
            Updates the product stock based on the product ID and the status.
            Arguments:
                - product_id: The ID of the product to update.
                - status: The status to update stock based on ("Cancelled", "Paid", "SkillsFuture Done").
            """
            try:
                # Fetch current product details
                url = f"{settings.WOOCOMMERCE_API_URL}products/{product_id}"
                auth = (settings.WOOCOMMERCE_CONSUMER_KEY, settings.WOOCOMMERCE_CONSUMER_SECRET)
                response = requests.get(url, auth=auth)
                response.raise_for_status()

                product = response.json()

                # Get the current stock quantity
                original_stock_quantity = product.get("stock_quantity", 0)
                new_stock_quantity = original_stock_quantity  # Start with current stock
                print("Current Stock Quantity:", new_stock_quantity)

                # Parse short description to find "vacancy"
                short_description = product.get("short_description", "")
                array = short_description.split("<p>")
                if array and array[0] == '':
                    array.pop(0)  # Remove empty first entry

                # Extract the number of vacancies directly within this function
                vacancies_text = next(
                    (item.replace("\n", "").replace("<b>", "").replace("</b>", "")
                    for item in array if "vacancy" in item.lower()),
                    ""
                ).split("<br />")[-1].strip()
                vacancies_text = vacancies_text.replace("</p>", "").strip()        

                print("Vacancies Text:", vacancies_text)

                # Extract actual vacancies number using a regex directly in this function
                vacancies_match = re.search(r'(\d+)\s*Vacancies', vacancies_text)
                if vacancies_match:
                    vacancies = math.ceil(int(vacancies_match.group(1))*1.5)
                else:
                    vacancies = 0  # Return 0 if no vacancies are found

                print("Actual Vacancies:", vacancies)

                if new_stock_quantity < vacancies:  # Only increase stock if it is below vacancies
                    print("Increase stock by 1")
                    new_stock_quantity += 1
                else:
                    print("Stock is full, no increase.")  # Prevent increase beyond vacancies

                print("Updated Stock Quantity:", new_stock_quantity)

                # Only update stock if it has changed
                update_data = {"stock_quantity": new_stock_quantity}
                update_response = requests.put(f"{settings.WOOCOMMERCE_API_URL}products/{product_id}",
                                                json=update_data, auth=auth)
                update_response.raise_for_status()

                return True  # Successfully updated stock

            except requests.exceptions.RequestException as e:
                print(f"Error updating product stock: {e}")
                return False
