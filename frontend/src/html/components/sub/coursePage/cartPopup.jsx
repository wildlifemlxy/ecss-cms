import {React, Component} from 'react';
import "../../../../css/sub/coursePage/cartPopup.css"; // Import the CartPopup CSS styles here

class CartPopup extends Component 
{
  render() {
    const { cartItems, onClose, renderCourseName1, handleCheckout } = this.props;

    console.log("Cart Items:", cartItems);

    return (
      <div className="cart-popup-overlay">
        <div className="cart-popup">
          <h2>Your Cart</h2>

          {cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <div className="cart-items-list">
              {cartItems.map((item, index) => (
                <div key={index} className="cart-item">
                  <img src={item.imageUrl} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    {renderCourseName1(item.name)}
                    <p className="cart-item-price">${item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="button-container">
            <button onClick={onClose}>Close</button>
            <button onClick={()  => handleCheckout(cartItems)}>Checkout</button>
          </div>      
        </div>
      </div>
    );
  }
}

export default CartPopup;
