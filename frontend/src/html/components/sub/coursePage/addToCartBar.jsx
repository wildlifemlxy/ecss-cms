import React from "react";
import { FaShoppingCart } from "react-icons/fa"; // Import cart icon
import "../../../../css/sub/coursePage/addToCartBar.css"; // Import your styles

class AddToCartBar extends React.Component {
  render() {
    const { cartItemCount, onCartClick } = this.props;

    return (
      <div className="add-to-cart-bar">
        <div className="cart-info">
          {/* Replaced button with div */}
          <div className="cart-button" onClick={onCartClick}>
            <FaShoppingCart className="cart-icon" />
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default AddToCartBar;
