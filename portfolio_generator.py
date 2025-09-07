#!/usr/bin/env python3
"""
Automatic Portfolio Generator - Python Implementation
This script replicates the exact logic from the React Portfolio Generator
"""

import pandas as pd
import math
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

@dataclass
class OptionData:
    """Represents a single option with all its properties"""
    StockName: str
    OptionName: str
    ExpiryDate: str
    StrikePrice: float
    Premium: float  # This will be the recalculated premium
    Bid: float
    Ask: Optional[float]
    NumberOfContractsBasedOnLimit: int
    Bid_Ask_Mid_Price: float
    ProbWorthless_Bayesian_IsoCal: float
    prob_1_2_3_ProbOfWorthless_Weighted: float
    prob_1_ProbOfWorthless_Original: float
    prob_2_ProbOfWorthless_Calibrated: float
    prob_3_ProbOfWorthless_Historical_IV: float
    # Add other fields as needed

class PortfolioGenerator:
    def __init__(self, underlying_value: float = 100000, transaction_cost: float = 150):
        self.underlying_value = underlying_value
        self.transaction_cost = transaction_cost
        
    def recalculate_option_data(self, options: List[Dict]) -> List[OptionData]:
        """
        Recalculates option premiums based on underlying value
        Replicates the useRecalculatedOptions hook logic
        """
        recalculated_options = []
        
        for option in options:
            # Recalculate based on the new underlying value
            number_of_contracts = round((self.underlying_value / option['StrikePrice']) / 100)
            
            # Calculate bid-ask mid price
            ask_price = option.get('Ask', option['Bid'])
            bid_ask_mid_price = (option['Bid'] + ask_price) / 2
            
            # Calculate recalculated premium
            recalculated_premium = round((bid_ask_mid_price * number_of_contracts * 100) - self.transaction_cost)
            
            # Create OptionData object with recalculated values
            option_data = OptionData(
                StockName=option['StockName'],
                OptionName=option['OptionName'],
                ExpiryDate=option['ExpiryDate'],
                StrikePrice=option['StrikePrice'],
                Premium=recalculated_premium,  # Use recalculated premium
                Bid=option['Bid'],
                Ask=option.get('Ask'),
                NumberOfContractsBasedOnLimit=number_of_contracts,
                Bid_Ask_Mid_Price=bid_ask_mid_price,
                ProbWorthless_Bayesian_IsoCal=option.get('ProbWorthless_Bayesian_IsoCal', 0),
                prob_1_2_3_ProbOfWorthless_Weighted=option.get('1_2_3_ProbOfWorthless_Weighted', 0),
                prob_1_ProbOfWorthless_Original=option.get('1_ProbOfWorthless_Original', 0),
                prob_2_ProbOfWorthless_Calibrated=option.get('2_ProbOfWorthless_Calibrated', 0),
                prob_3_ProbOfWorthless_Historical_IV=option.get('3_ProbOfWorthless_Historical_IV', 0)
            )
            
            recalculated_options.append(option_data)
            
        return recalculated_options
    
    def get_low_price_for_period(self, stock_name: str, days: int, stock_data: List[Dict]) -> Optional[float]:
        """
        Get the lowest price for a stock within a specified period
        This would normally query historical stock data
        """
        # For demo purposes, return a mock value
        # In real implementation, this would filter stock_data by stock_name and date range
        stock_prices = [data for data in stock_data if data['name'] == stock_name]
        if not stock_prices:
            return None
        
        # Mock logic - return a value slightly below current price
        current_price = stock_prices[-1]['close'] if stock_prices else 100
        return current_price * 0.9  # 10% below current price as mock low
    
    def get_probability_value(self, option: OptionData, probability_field: str) -> float:
        """
        Get probability value with fallback logic
        """
        # Map probability field names to actual attributes
        field_mapping = {
            "ProbWorthless_Bayesian_IsoCal": option.ProbWorthless_Bayesian_IsoCal,
            "1_2_3_ProbOfWorthless_Weighted": option.prob_1_2_3_ProbOfWorthless_Weighted,
            "1_ProbOfWorthless_Original": option.prob_1_ProbOfWorthless_Original,
            "2_ProbOfWorthless_Calibrated": option.prob_2_ProbOfWorthless_Calibrated,
            "3_ProbOfWorthless_Historical_IV": option.prob_3_ProbOfWorthless_Historical_IV,
        }
        
        primary_value = field_mapping.get(probability_field, 0)
        fallback_value = option.prob_1_2_3_ProbOfWorthless_Weighted
        
        return primary_value or fallback_value or 0
    
    def generate_portfolio(self, 
                         options: List[Dict],
                         stock_data: List[Dict],
                         total_premium_target: int,
                         strike_below_period: Optional[int] = None,
                         selected_expiry_date: str = "",
                         min_probability_worthless: Optional[int] = None,
                         selected_probability_field: str = "ProbWorthless_Bayesian_IsoCal") -> Tuple[List[OptionData], Dict]:
        """
        Generate portfolio based on specified criteria
        Returns tuple of (selected_options, portfolio_info)
        """
        
        # Step 1: Recalculate option data based on underlying value
        print(f"Recalculating options with underlying value: {self.underlying_value:,} SEK")
        recalculated_options = self.recalculate_option_data(options)
        
        # Step 2: Filter options based on criteria
        filtered_options = []
        
        for option in recalculated_options:
            # Basic checks - premium must be positive
            if option.Premium <= 0:
                continue
                
            # Strike price below period filter
            if strike_below_period:
                low_price = self.get_low_price_for_period(option.StockName, strike_below_period, stock_data)
                if not low_price or option.StrikePrice > low_price:
                    continue
            
            # Expiry date filter
            if selected_expiry_date and option.ExpiryDate != selected_expiry_date:
                continue
                
            # Probability filter
            if min_probability_worthless:
                prob = self.get_probability_value(option, selected_probability_field)
                min_prob_decimal = min_probability_worthless / 100  # Convert percentage to decimal
                if prob < min_prob_decimal:
                    continue
                    
            filtered_options.append(option)
        
        print(f"After filtering: {len(filtered_options)} options remain")
        
        # Step 3: Sort options for optimal selection
        def sort_key(option):
            prob = self.get_probability_value(option, selected_probability_field)
            
            if min_probability_worthless:
                # When minimum probability is set, prioritize options closest to target
                min_prob_decimal = min_probability_worthless / 100
                diff_from_target = abs(prob - min_prob_decimal)
                return (diff_from_target, -option.Premium)  # Closest to target first, then higher premium
            else:
                # When no minimum is set, prioritize highest probability
                return (-prob, -option.Premium)  # Higher probability first, then higher premium
        
        filtered_options.sort(key=sort_key)
        
        # Step 4: Select options (max one per stock)
        selected_options = []
        used_stocks = set()
        total_premium = 0
        
        for option in filtered_options:
            if option.StockName in used_stocks:
                continue
                
            if total_premium + option.Premium <= total_premium_target:
                selected_options.append(option)
                used_stocks.add(option.StockName)
                total_premium += option.Premium
        
        # Step 5: Try to fill remaining capacity with unused stocks
        if total_premium < total_premium_target:
            remaining_options = [opt for opt in filtered_options 
                               if opt.StockName not in used_stocks and 
                               opt.Premium <= (total_premium_target - total_premium)]
            
            for option in remaining_options:
                if total_premium + option.Premium <= total_premium_target:
                    selected_options.append(option)
                    used_stocks.add(option.StockName)
                    total_premium += option.Premium
        
        # Step 6: Calculate portfolio statistics
        total_underlying_value = sum(
            option.NumberOfContractsBasedOnLimit * option.StrikePrice * 100 
            for option in selected_options
        )
        
        # Generate status message
        if total_premium < total_premium_target:
            deficit = total_premium_target - total_premium
            message = f"Portfolio generated with {total_premium:,} SEK premium ({deficit:,} SEK below target). Available options could not reach the full target amount."
        else:
            message = f"Portfolio successfully generated with {total_premium:,} SEK premium, meeting your target."
        
        portfolio_info = {
            'total_premium': total_premium,
            'total_underlying_value': total_underlying_value,
            'target_premium': total_premium_target,
            'message': message,
            'num_options': len(selected_options),
            'underlying_value_used': self.underlying_value
        }
        
        return selected_options, portfolio_info

def create_sample_data():
    """Create sample data for testing"""
    
    # Sample options data
    options_data = [
        {
            'StockName': 'AAPL',
            'OptionName': 'AAPL Call 150 2024-03-15',
            'ExpiryDate': '2024-03-15',
            'StrikePrice': 150.0,
            'Bid': 2.50,
            'Ask': 2.60,
            'ProbWorthless_Bayesian_IsoCal': 0.75,
            '1_2_3_ProbOfWorthless_Weighted': 0.72,
            '1_ProbOfWorthless_Original': 0.70,
            '2_ProbOfWorthless_Calibrated': 0.74,
            '3_ProbOfWorthless_Historical_IV': 0.76
        },
        {
            'StockName': 'MSFT',
            'OptionName': 'MSFT Call 300 2024-03-15',
            'ExpiryDate': '2024-03-15',
            'StrikePrice': 300.0,
            'Bid': 1.80,
            'Ask': 1.90,
            'ProbWorthless_Bayesian_IsoCal': 0.80,
            '1_2_3_ProbOfWorthless_Weighted': 0.78,
            '1_ProbOfWorthless_Original': 0.76,
            '2_ProbOfWorthless_Calibrated': 0.82,
            '3_ProbOfWorthless_Historical_IV': 0.81
        },
        {
            'StockName': 'GOOGL',
            'OptionName': 'GOOGL Call 120 2024-04-15',
            'ExpiryDate': '2024-04-15',
            'StrikePrice': 120.0,
            'Bid': 3.20,
            'Ask': 3.30,
            'ProbWorthless_Bayesian_IsoCal': 0.65,
            '1_2_3_ProbOfWorthless_Weighted': 0.68,
            '1_ProbOfWorthless_Original': 0.63,
            '2_ProbOfWorthless_Calibrated': 0.67,
            '3_ProbOfWorthless_Historical_IV': 0.69
        }
    ]
    
    # Sample stock data
    stock_data = [
        {'name': 'AAPL', 'close': 145.0, 'date': '2024-01-15'},
        {'name': 'MSFT', 'close': 290.0, 'date': '2024-01-15'},
        {'name': 'GOOGL', 'close': 115.0, 'date': '2024-01-15'}
    ]
    
    return options_data, stock_data

def main():
    """Example usage of the portfolio generator"""
    
    # Create sample data
    options_data, stock_data = create_sample_data()
    
    # Initialize portfolio generator
    generator = PortfolioGenerator(
        underlying_value=100000,  # 100,000 SEK
        transaction_cost=150      # 150 SEK
    )
    
    # Generate portfolio
    selected_options, portfolio_info = generator.generate_portfolio(
        options=options_data,
        stock_data=stock_data,
        total_premium_target=5000,  # Target 5,000 SEK premium
        strike_below_period=None,   # No strike price filter
        selected_expiry_date="",    # Any expiry date
        min_probability_worthless=70,  # Minimum 70% probability
        selected_probability_field="ProbWorthless_Bayesian_IsoCal"
    )
    
    # Print results
    print("\n" + "="*50)
    print("PORTFOLIO GENERATION RESULTS")
    print("="*50)
    print(f"Configuration:")
    print(f"  - Underlying Value: {generator.underlying_value:,} SEK")
    print(f"  - Transaction Cost: {generator.transaction_cost} SEK")
    print(f"  - Target Premium: {portfolio_info['target_premium']:,} SEK")
    print(f"  - Min Probability: 70%")
    
    print(f"\nResults:")
    print(f"  - {portfolio_info['message']}")
    print(f"  - Total Underlying Value: {portfolio_info['total_underlying_value']:,} SEK")
    print(f"  - Number of Options: {portfolio_info['num_options']}")
    
    print(f"\nSelected Options:")
    for i, option in enumerate(selected_options, 1):
        prob = generator.get_probability_value(option, "ProbWorthless_Bayesian_IsoCal")
        print(f"  {i}. {option.StockName} - Strike: {option.StrikePrice} - Premium: {option.Premium:,} SEK - Prob: {prob*100:.1f}%")

if __name__ == "__main__":
    main()