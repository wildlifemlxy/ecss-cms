import React, { Component } from 'react';
import { Card } from 'react-bootstrap';
import { ArrowUp, ArrowDown, DollarSign, Users, ShoppingCart, Percent } from 'lucide-react';

class StatCard extends Component {
  renderIcon() {
    const { icon } = this.props;
    const iconSize = 24;
    
    switch(icon) {
      case 'dollar-sign':
        return <DollarSign size={iconSize} />;
      case 'users':
        return <Users size={iconSize} />;
      case 'shopping-cart':
        return <ShoppingCart size={iconSize} />;
      case 'percent':
        return <Percent size={iconSize} />;
      default:
        return <DollarSign size={iconSize} />;
    }
  }

  render() {
    const { title, value, change } = this.props;
    const isPositive = change >= 0;
    
    return (
      <Card className="stat-card">
        <Card.Body>
          <div className="stat-icon">
            {this.renderIcon()}
          </div>
          <div className="stat-content">
            <h6 className="stat-title">{title}</h6>
            <h3 className="stat-value">{value}</h3>
            <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              <span>{Math.abs(change)}% since last month</span>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }
}

export default StatCard;