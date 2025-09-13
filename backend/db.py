import boto3
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os

class DatabaseManager:
    def __init__(self):
        """Initialize DynamoDB connection"""
        # For local development, you can use DynamoDB Local
        # For production, use AWS DynamoDB
        self.dynamodb = boto3.resource(
            'dynamodb',
            region_name=os.getenv('AWS_REGION', 'us-east-1'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        # Initialize tables
        self.users_table = self.dynamodb.Table('goose_tokens_users')
        self.quests_table = self.dynamodb.Table('goose_tokens_quests')
        self.bets_table = self.dynamodb.Table('goose_tokens_bets')
        self.money_stats_table = self.dynamodb.Table('goose_tokens_money_stats')
        
        # Create tables if they don't exist (for local development)
        self._create_tables_if_not_exist()
    
    def _create_tables_if_not_exist(self):
        """Create DynamoDB tables if they don't exist (for local development)"""
        try:
            # Check if tables exist
            self.users_table.table_status
            self.quests_table.table_status
            self.bets_table.table_status
            self.money_stats_table.table_status
        except:
            # Tables don't exist, create them
            self._create_tables()
    
    def _create_tables(self):
        """Create DynamoDB tables"""
        try:
            # Users table
            self.dynamodb.create_table(
                TableName='goose_tokens_users',
                KeySchema=[
                    {'AttributeName': 'user_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'user_id', 'AttributeType': 'S'}
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            
            # Quests table
            self.dynamodb.create_table(
                TableName='goose_tokens_quests',
                KeySchema=[
                    {'AttributeName': 'quest_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'quest_id', 'AttributeType': 'S'},
                    {'AttributeName': 'user_id', 'AttributeType': 'S'}
                ],
                GlobalSecondaryIndexes=[
                    {
                        'IndexName': 'user-quests-index',
                        'KeySchema': [
                            {'AttributeName': 'user_id', 'KeyType': 'HASH'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            
            # Bets table
            self.dynamodb.create_table(
                TableName='goose_tokens_bets',
                KeySchema=[
                    {'AttributeName': 'bet_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'bet_id', 'AttributeType': 'S'},
                    {'AttributeName': 'user_id', 'AttributeType': 'S'}
                ],
                GlobalSecondaryIndexes=[
                    {
                        'IndexName': 'user-bets-index',
                        'KeySchema': [
                            {'AttributeName': 'user_id', 'KeyType': 'HASH'}
                        ],
                        'Projection': {'ProjectionType': 'ALL'}
                    }
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            
            # Money stats table
            self.dynamodb.create_table(
                TableName='goose_tokens_money_stats',
                KeySchema=[
                    {'AttributeName': 'user_id', 'KeyType': 'HASH'}
                ],
                AttributeDefinitions=[
                    {'AttributeName': 'user_id', 'AttributeType': 'S'}
                ],
                BillingMode='PAY_PER_REQUEST'
            )
            
            print("Tables created successfully!")
            
        except Exception as e:
            print(f"Error creating tables: {e}")
            # For demo purposes, we'll use in-memory storage
            self._use_memory_storage()
    
    def _use_memory_storage(self):
        """Fallback to in-memory storage for demo purposes"""
        self.memory_storage = {
            'users': {},
            'quests': {},
            'bets': {},
            'money_stats': {}
        }
        print("Using in-memory storage for demo")
    
    async def get_user_balance(self, user_id: str) -> int:
        """Get user's current GooseToken balance"""
        try:
            if hasattr(self, 'memory_storage'):
                return self.memory_storage['users'].get(user_id, {}).get('balance', 100)
            
            response = self.users_table.get_item(Key={'user_id': user_id})
            if 'Item' in response:
                return response['Item'].get('balance', 100)
            else:
                # Create new user with starting balance
                await self.create_user(user_id)
                return 100
        except Exception as e:
            print(f"Error getting user balance: {e}")
            return 100
    
    async def create_user(self, user_id: str, initial_balance: int = 100) -> Dict:
        """Create a new user with initial GooseToken balance"""
        try:
            if hasattr(self, 'memory_storage'):
                self.memory_storage['users'][user_id] = {
                    'user_id': user_id,
                    'balance': initial_balance,
                    'created_at': datetime.now().isoformat()
                }
                # Initialize money stats
                self.memory_storage['money_stats'][user_id] = {
                    'user_id': user_id,
                    'total_wagered': 0,
                    'total_won': 0,
                    'total_lost': 0,
                    'net_profit': 0,
                    'bets_won': 0,
                    'bets_lost': 0,
                    'sponsor_breakdown': {}
                }
                return self.memory_storage['users'][user_id]
            
            user_data = {
                'user_id': user_id,
                'balance': initial_balance,
                'created_at': datetime.now().isoformat(),
                'total_quests_completed': 0,
                'total_bets_placed': 0
            }
            
            self.users_table.put_item(Item=user_data)
            
            # Initialize money stats
            money_stats = {
                'user_id': user_id,
                'total_wagered': 0,
                'total_won': 0,
                'total_lost': 0,
                'net_profit': 0,
                'bets_won': 0,
                'bets_lost': 0,
                'sponsor_breakdown': {}
            }
            self.money_stats_table.put_item(Item=money_stats)
            
            return user_data
            
        except Exception as e:
            print(f"Error creating user: {e}")
            return {'user_id': user_id, 'balance': initial_balance}
    
    async def award_tokens(self, user_id: str, amount: int) -> int:
        """Award GooseTokens to a user"""
        try:
            if hasattr(self, 'memory_storage'):
                if user_id not in self.memory_storage['users']:
                    await self.create_user(user_id)
                
                current_balance = self.memory_storage['users'][user_id]['balance']
                new_balance = current_balance + amount
                self.memory_storage['users'][user_id]['balance'] = new_balance
                return new_balance
            
            # Update balance in DynamoDB
            response = self.users_table.update_item(
                Key={'user_id': user_id},
                UpdateExpression='ADD balance :amount',
                ExpressionAttributeValues={':amount': amount},
                ReturnValues='UPDATED_NEW'
            )
            
            return response['Attributes']['balance']
            
        except Exception as e:
            print(f"Error awarding tokens: {e}")
            return await self.get_user_balance(user_id)
    
    async def deduct_tokens(self, user_id: str, amount: int) -> int:
        """Deduct GooseTokens from a user"""
        try:
            current_balance = await self.get_user_balance(user_id)
            
            if current_balance < amount:
                raise ValueError("Insufficient balance")
            
            if hasattr(self, 'memory_storage'):
                new_balance = current_balance - amount
                self.memory_storage['users'][user_id]['balance'] = new_balance
                return new_balance
            
            # Update balance in DynamoDB
            response = self.users_table.update_item(
                Key={'user_id': user_id},
                UpdateExpression='ADD balance :amount',
                ExpressionAttributeValues={':amount': -amount},
                ReturnValues='UPDATED_NEW'
            )
            
            return response['Attributes']['balance']
            
        except Exception as e:
            print(f"Error deducting tokens: {e}")
            return await self.get_user_balance(user_id)
    
    async def complete_quest(self, quest_id: str, user_id: str) -> Dict:
        """Mark a quest as completed"""
        try:
            quest_data = {
                'quest_id': quest_id,
                'user_id': user_id,
                'status': 'completed',
                'completed_at': datetime.now().isoformat()
            }
            
            if hasattr(self, 'memory_storage'):
                self.memory_storage['quests'][quest_id] = quest_data
            else:
                self.quests_table.put_item(Item=quest_data)
            
            return quest_data
            
        except Exception as e:
            print(f"Error completing quest: {e}")
            return {'quest_id': quest_id, 'status': 'completed'}
    
    async def create_bet(self, user_id: str, betting_line: str, stake: int) -> str:
        """Create a new bet (legacy function)"""
        return await self.create_enhanced_bet(user_id, betting_line, stake, "General", 1.0, stake)

    async def create_enhanced_bet(self, user_id: str, betting_line: str, stake: int, 
                                sponsor: str, multiplier: float, potential_winnings: int) -> str:
        """Create an enhanced bet with sponsor information and money tracking"""
        try:
            bet_id = str(uuid.uuid4())
            bet_data = {
                'bet_id': bet_id,
                'user_id': user_id,
                'betting_line': betting_line,
                'stake': stake,
                'sponsor': sponsor,
                'multiplier': multiplier,
                'potential_winnings': potential_winnings,
                'status': 'active',
                'created_at': datetime.now().isoformat(),
                'resolved_at': None,
                'winnings': 0,
                'net_result': 0
            }
            
            if hasattr(self, 'memory_storage'):
                self.memory_storage['bets'][bet_id] = bet_data
            else:
                self.bets_table.put_item(Item=bet_data)
            
            return bet_id
            
        except Exception as e:
            print(f"Error creating enhanced bet: {e}")
            return str(uuid.uuid4())
    
    async def get_user_quests(self, user_id: str) -> List[Dict]:
        """Get all quests for a user"""
        try:
            if hasattr(self, 'memory_storage'):
                quests = [q for q in self.memory_storage['quests'].values() if q['user_id'] == user_id]
                return quests
            
            response = self.quests_table.query(
                IndexName='user-quests-index',
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )
            
            return response.get('Items', [])
            
        except Exception as e:
            print(f"Error getting user quests: {e}")
            return []
    
    async def get_user_bets(self, user_id: str) -> List[Dict]:
        """Get all bets for a user"""
        try:
            if hasattr(self, 'memory_storage'):
                bets = [b for b in self.memory_storage['bets'].values() if b['user_id'] == user_id]
                return bets
            
            response = self.bets_table.query(
                IndexName='user-bets-index',
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )
            
            return response.get('Items', [])
            
        except Exception as e:
            print(f"Error getting user bets: {e}")
            return []
    
    async def resolve_bet(self, bet_id: str, won: bool) -> Dict:
        """Resolve a bet (win/lose) with money tracking"""
        try:
            if hasattr(self, 'memory_storage'):
                if bet_id in self.memory_storage['bets']:
                    bet = self.memory_storage['bets'][bet_id]
                    bet['status'] = 'won' if won else 'lost'
                    bet['resolved_at'] = datetime.now().isoformat()
                    
                    if won:
                        # Award winnings
                        winnings = bet['potential_winnings']
                        bet['winnings'] = winnings
                        bet['net_result'] = winnings - bet['stake']
                        await self.award_tokens(bet['user_id'], winnings)
                    else:
                        bet['winnings'] = 0
                        bet['net_result'] = -bet['stake']
                    
                    # Update money stats
                    await self.update_money_stats(bet['user_id'], bet)
                    
                    return bet
                return {}
            
            # Update bet status in DynamoDB
            update_expression = 'SET #status = :status, resolved_at = :resolved_at'
            expression_values = {
                ':status': 'won' if won else 'lost',
                ':resolved_at': datetime.now().isoformat()
            }
            
            if won:
                # Get potential winnings from the bet
                bet_response = self.bets_table.get_item(Key={'bet_id': bet_id})
                if 'Item' in bet_response:
                    bet_item = bet_response['Item']
                    winnings = bet_item['potential_winnings']
                    update_expression += ', winnings = :winnings, net_result = :net_result'
                    expression_values[':winnings'] = winnings
                    expression_values[':net_result'] = winnings - bet_item['stake']
                    
                    # Award winnings
                    await self.award_tokens(bet_item['user_id'], winnings)
            
            response = self.bets_table.update_item(
                Key={'bet_id': bet_id},
                UpdateExpression=update_expression,
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues=expression_values,
                ReturnValues='ALL_NEW'
            )
            
            # Update money stats
            bet_data = response['Attributes']
            await self.update_money_stats(bet_data['user_id'], bet_data)
            
            return response['Attributes']
            
        except Exception as e:
            print(f"Error resolving bet: {e}")
            return {}
    
    async def update_money_stats(self, user_id: str, bet_data: Dict):
        """Update user's money tracking statistics"""
        try:
            if hasattr(self, 'memory_storage'):
                if user_id not in self.memory_storage['money_stats']:
                    self.memory_storage['money_stats'][user_id] = {
                        'user_id': user_id,
                        'total_wagered': 0,
                        'total_won': 0,
                        'total_lost': 0,
                        'net_profit': 0,
                        'bets_won': 0,
                        'bets_lost': 0,
                        'sponsor_breakdown': {}
                    }
                
                stats = self.memory_storage['money_stats'][user_id]
                stats['total_wagered'] += bet_data['stake']
                
                if bet_data['status'] == 'won':
                    stats['total_won'] += bet_data['winnings']
                    stats['bets_won'] += 1
                else:
                    stats['total_lost'] += bet_data['stake']
                    stats['bets_lost'] += 1
                
                stats['net_profit'] = stats['total_won'] - stats['total_lost']
                
                # Update sponsor breakdown
                sponsor = bet_data.get('sponsor', 'General')
                if sponsor not in stats['sponsor_breakdown']:
                    stats['sponsor_breakdown'][sponsor] = {
                        'bets_placed': 0,
                        'bets_won': 0,
                        'total_wagered': 0,
                        'total_won': 0,
                        'net_profit': 0
                    }
                
                sponsor_stats = stats['sponsor_breakdown'][sponsor]
                sponsor_stats['bets_placed'] += 1
                sponsor_stats['total_wagered'] += bet_data['stake']
                
                if bet_data['status'] == 'won':
                    sponsor_stats['bets_won'] += 1
                    sponsor_stats['total_won'] += bet_data['winnings']
                
                sponsor_stats['net_profit'] = sponsor_stats['total_won'] - sponsor_stats['total_wagered']
                
            else:
                # Update in DynamoDB
                update_expression = 'ADD total_wagered :stake'
                expression_values = {':stake': bet_data['stake']}
                
                if bet_data['status'] == 'won':
                    update_expression += ', total_won :winnings, bets_won :one'
                    expression_values[':winnings'] = bet_data['winnings']
                    expression_values[':one'] = 1
                else:
                    update_expression += ', total_lost :stake, bets_lost :one'
                    expression_values[':one'] = 1
                
                # Update sponsor breakdown
                sponsor = bet_data.get('sponsor', 'General')
                sponsor_key = f"sponsor_breakdown.{sponsor}"
                
                self.money_stats_table.update_item(
                    Key={'user_id': user_id},
                    UpdateExpression=update_expression,
                    ExpressionAttributeValues=expression_values
                )
                
        except Exception as e:
            print(f"Error updating money stats: {e}")
    
    async def get_money_stats(self, user_id: str) -> Dict:
        """Get user's money tracking statistics"""
        try:
            if hasattr(self, 'memory_storage'):
                return self.memory_storage['money_stats'].get(user_id, {
                    'user_id': user_id,
                    'total_wagered': 0,
                    'total_won': 0,
                    'total_lost': 0,
                    'net_profit': 0,
                    'bets_won': 0,
                    'bets_lost': 0,
                    'sponsor_breakdown': {}
                })
            
            response = self.money_stats_table.get_item(Key={'user_id': user_id})
            if 'Item' in response:
                return response['Item']
            else:
                # Initialize stats for new user
                await self.create_user(user_id)
                return {
                    'user_id': user_id,
                    'total_wagered': 0,
                    'total_won': 0,
                    'total_lost': 0,
                    'net_profit': 0,
                    'bets_won': 0,
                    'bets_lost': 0,
                    'sponsor_breakdown': {}
                }
                
        except Exception as e:
            print(f"Error getting money stats: {e}")
            return {
                'user_id': user_id,
                'total_wagered': 0,
                'total_won': 0,
                'total_lost': 0,
                'net_profit': 0,
                'bets_won': 0,
                'bets_lost': 0,
                'sponsor_breakdown': {}
            }
