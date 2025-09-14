import os
import cohere
import google.generativeai as genai
from typing import List, Dict
import json
import random
from datetime import datetime

# Initialize Cohere client
cohere_api_key = os.getenv("COHERE_API_KEY")
if cohere_api_key:
    co = cohere.Client(cohere_api_key)
else:
    co = None
    print("Warning: COHERE_API_KEY not found. LLM features will be limited.")

# Initialize Gemini client
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    gemini_model = genai.GenerativeModel('gemini-pro')
else:
    gemini_model = None
    print("Warning: GEMINI_API_KEY not found. Using fallback LLM features.")

def create_sponsor_betting_lines(detection_result: Dict) -> List[Dict]:
    """
    Create sponsor-specific betting lines based on detected objects and categories
    
    Args:
        detection_result: Dictionary with objects, sponsor_categories, and betting_opportunities
    
    Returns:
        List of enhanced betting line dictionaries with sponsor information
    """
    if not detection_result.get("objects"):
        return []
    
    objects = detection_result["objects"]
    sponsor_categories = detection_result.get("sponsor_categories", [])
    betting_opportunities = detection_result.get("betting_opportunities", [])
    
    # Try Gemini first (better for creative content)
    if gemini_model is not None:
        return create_betting_lines_with_gemini(objects, sponsor_categories, betting_opportunities)
    
    # Fallback to Cohere
    if co is not None:
        return create_betting_lines_with_cohere(objects, sponsor_categories, betting_opportunities)
    
    # Final fallback
    return create_mock_sponsor_betting_lines(objects, sponsor_categories, betting_opportunities)

def create_betting_lines_with_gemini(objects: List[str], sponsor_categories: List[str], betting_opportunities: List[Dict]) -> List[Dict]:
    """Create betting lines using Gemini"""
    try:
        objects_str = ", ".join(objects)
        sponsors_str = ", ".join(sponsor_categories) if sponsor_categories else "General"
        
        prompt = f"""Create 3 funny and creative betting lines for a hackathon based on these detected objects: {objects_str}
        
Sponsor categories involved: {sponsors_str}

Each betting line should be:
- Hilarious and hackathon-themed
- Related to the detected objects
- Include sponsor branding naturally
- Have realistic odds for a hackathon setting
- Include potential winnings calculation

Format as JSON array with this structure:
[
    {{"line": "funny betting line text", "odds": "2:1", "base_stake": 10, "sponsor": "Tech Giants", "multiplier": 1.5, "max_potential_win": 15}},
    {{"line": "another funny line", "odds": "3:1", "base_stake": 15, "sponsor": "Food Delivery", "multiplier": 2.0, "max_potential_win": 30}},
    {{"line": "third funny line", "odds": "5:1", "base_stake": 20, "sponsor": "Sports & Fitness", "multiplier": 2.2, "max_potential_win": 44}}
]

Make the lines creative and hackathon-specific!"""

        response = gemini_model.generate_content(prompt)
        
        # Try to parse JSON response
        try:
            betting_lines = json.loads(response.text.strip())
            return betting_lines
        except json.JSONDecodeError:
            print("Failed to parse Gemini JSON response")
            return create_mock_sponsor_betting_lines(objects, sponsor_categories, betting_opportunities)
    
    except Exception as e:
        print(f"Error creating betting lines with Gemini: {e}")
        return create_mock_sponsor_betting_lines(objects, sponsor_categories, betting_opportunities)

def create_betting_lines_with_cohere(objects: List[str], sponsor_categories: List[str], betting_opportunities: List[Dict]) -> List[Dict]:
    """Create betting lines using Cohere"""
    try:
        objects_str = ", ".join(objects)
        sponsors_str = ", ".join(sponsor_categories) if sponsor_categories else "General"
        
        prompt = f"""Create 3 funny and creative betting lines for a hackathon based on these detected objects: {objects_str}
        
Sponsor categories involved: {sponsors_str}

Each betting line should be:
- Hilarious and hackathon-themed
- Related to the detected objects
- Include sponsor branding naturally
- Have realistic odds for a hackathon setting

Format as JSON array with this structure:
[
    {{"line": "funny betting line text", "odds": "2:1", "base_stake": 10, "sponsor": "Tech Giants", "multiplier": 1.5, "max_potential_win": 15}},
    {{"line": "another funny line", "odds": "3:1", "base_stake": 15, "sponsor": "Food Delivery", "multiplier": 2.0, "max_potential_win": 30}},
    {{"line": "third funny line", "odds": "5:1", "base_stake": 20, "sponsor": "Sports & Fitness", "multiplier": 2.2, "max_potential_win": 44}}
]"""

        response = co.generate(
            model='command',
            prompt=prompt,
            max_tokens=400,
            temperature=0.8
        )
        
        # Try to parse JSON response
        try:
            betting_lines = json.loads(response.generations[0].text.strip())
            return betting_lines
        except json.JSONDecodeError:
            print("Failed to parse Cohere JSON response")
            return create_mock_sponsor_betting_lines(objects, sponsor_categories, betting_opportunities)
    
    except Exception as e:
        print(f"Error creating betting lines with Cohere: {e}")
        return create_mock_sponsor_betting_lines(objects, sponsor_categories, betting_opportunities)

def create_mock_sponsor_betting_lines(objects: List[str], sponsor_categories: List[str], betting_opportunities: List[Dict]) -> List[Dict]:
    """Create mock betting lines with sponsor information"""
    mock_lines = []
    
    # Use betting opportunities if available
    for i, opp in enumerate(betting_opportunities[:3]):
        base_stake = random.choice([10, 15, 20, 25])
        odds = random.choice(["2:1", "3:1", "4:1", "5:1"])
        max_win = int(base_stake * opp["multiplier"])
        
        mock_lines.append({
            "line": f"Someone will spill coffee on their {opp['object']} in the next hour",
            "odds": odds,
            "base_stake": base_stake,
            "sponsor": opp["sponsor"],
            "multiplier": opp["multiplier"],
            "max_potential_win": max_win
        })
    
    # Fill remaining slots with generic lines
    generic_lines = [
        "At least 3 people will ask about your project setup",
        "Someone will take a photo for their LinkedIn",
        "A team will order food delivery within 30 minutes",
        "Someone will mention 'AI' or 'blockchain' in their pitch",
        "A laptop will run out of battery during a demo"
    ]
    
    for i in range(len(mock_lines), 3):
        if i < len(generic_lines):
            base_stake = random.choice([10, 15, 20])
            odds = random.choice(["2:1", "3:1", "4:1"])
            sponsor = random.choice(sponsor_categories) if sponsor_categories else "General"
            multiplier = random.choice([1.5, 2.0, 2.5])
            max_win = int(base_stake * multiplier)
            
            mock_lines.append({
                "line": generic_lines[i],
                "odds": odds,
                "base_stake": base_stake,
                "sponsor": sponsor,
                "multiplier": multiplier,
                "max_potential_win": max_win
            })
    
    return mock_lines

# Legacy function for backward compatibility
def create_betting_lines(objects: List[str]) -> List[Dict]:
    """Legacy function - use create_sponsor_betting_lines for enhanced features"""
    detection_result = {
        "objects": objects,
        "sponsor_categories": [],
        "betting_opportunities": []
    }
    return create_sponsor_betting_lines(detection_result)

def create_networking_prompt(face_info: Dict) -> str:
    """
    Create a networking quest suggestion based on detected face
    
    Args:
        face_info: Dictionary containing face detection information
    
    Returns:
        Networking quest suggestion string
    """
    if co is None:
        # Fallback: return mock networking prompts
        return create_mock_networking_prompt(face_info)
    
    try:
        confidence = face_info.get("confidence", 0.5)
        person_type = "a fellow hacker" if confidence > 0.7 else "someone new"
        
        prompt = f"""Create a friendly, encouraging networking quest for a hackathon when meeting {person_type}.

The quest should be:
- Specific and actionable
- Encouraging and positive
- Related to hackathon networking
- Not too pushy or awkward

Return just the quest description, no extra text."""

        response = co.generate(
            model='command',
            prompt=prompt,
            max_tokens=100,
            temperature=0.7
        )
        
        return response.generations[0].text.strip()
    
    except Exception as e:
        print(f"Error creating networking prompt: {e}")
        return create_mock_networking_prompt(face_info)

def create_conversation_starter(objects: List[str], context: str = "hackathon") -> str:
    """
    Create a conversation starter based on detected objects
    
    Args:
        objects: List of detected objects
        context: Context for the conversation (e.g., "hackathon", "networking")
    
    Returns:
        Conversation starter string
    """
    if not objects or co is None:
        return "Hey! I noticed you're working on something interesting. Mind if I ask what you're building?"
    
    try:
        objects_str = ", ".join(objects)
        prompt = f"""Create a natural, friendly conversation starter for a {context} based on these objects: {objects_str}.

The starter should be:
- Natural and not forced
- Related to the objects but not obvious
- Encouraging conversation
- Appropriate for a hackathon setting

Return just the conversation starter, no extra text."""

        response = co.generate(
            model='command',
            prompt=prompt,
            max_tokens=80,
            temperature=0.8
        )
        
        return response.generations[0].text.strip()
    
    except Exception as e:
        print(f"Error creating conversation starter: {e}")
        return "Hey! I noticed you're working on something interesting. Mind if I ask what you're building?"

def create_mock_betting_lines(objects: List[str]) -> List[Dict]:
    """Fallback betting lines when LLM is not available"""
    mock_lines = [
        {
            "line": f"Someone will spill coffee on their {objects[0] if objects else 'laptop'} in the next hour",
            "odds": "3:1",
            "stake": 5
        },
        {
            "line": f"At least 3 people will ask about the {objects[0] if objects else 'project'} you're working on",
            "odds": "2:1", 
            "stake": 10
        },
        {
            "line": f"Someone will take a photo of their {objects[0] if objects else 'setup'} for Instagram",
            "odds": "5:1",
            "stake": 15
        }
    ]
    return mock_lines

def create_mock_networking_prompt(face_info: Dict) -> str:
    """Fallback networking prompt when LLM is not available"""
    prompts = [
        "Introduce yourself and ask about their project",
        "Exchange LinkedIn profiles and discuss tech interests",
        "Ask what brought them to this hackathon",
        "Share your project idea and ask for feedback",
        "Discuss the most interesting tech you've seen today"
    ]
    
    # Use confidence to pick different prompts
    confidence = face_info.get("confidence", 0.5)
    index = int(confidence * len(prompts)) % len(prompts)
    return prompts[index]

def generate_quest_reward(quest_type: str, difficulty: str = "medium") -> int:
    """
    Generate appropriate GooseToken reward for quest completion
    
    Args:
        quest_type: Type of quest (networking, technical, social)
        difficulty: Difficulty level (easy, medium, hard)
    
    Returns:
        Token reward amount
    """
    base_rewards = {
        "networking": 10,
        "technical": 15,
        "social": 8,
        "creative": 12
    }
    
    difficulty_multipliers = {
        "easy": 0.5,
        "medium": 1.0,
        "hard": 1.5
    }
    
    base_reward = base_rewards.get(quest_type, 10)
    multiplier = difficulty_multipliers.get(difficulty, 1.0)
    
    return int(base_reward * multiplier)

def generate_quest_batch() -> List[Dict]:
    """
    Generate a batch of 5 random quest challenges for users to choose from
    
    Returns:
        List of 5 quest dictionaries with random challenges and prompts
    """
    quest_templates = [
        # Networking Quests
        {
            "type": "networking",
            "difficulty": "easy",
            "templates": [
                "Introduce yourself to someone new and ask about their project",
                "Exchange contact information with 2 people",
                "Find someone working on a similar technology and discuss it",
                "Ask 3 people about their hackathon experience so far",
                "Share your project idea and get feedback from someone"
            ]
        },
        {
            "type": "networking", 
            "difficulty": "medium",
            "templates": [
                "Organize a mini networking session with 4+ people",
                "Find someone from a different background and learn about their perspective",
                "Connect two people who should meet each other",
                "Lead a discussion about emerging tech trends",
                "Create a group chat for people interested in your domain"
            ]
        },
        # Technical Quests
        {
            "type": "technical",
            "difficulty": "easy", 
            "templates": [
                "Help someone debug their code",
                "Share a useful tool or library with the community",
                "Create a quick demo of your project",
                "Explain a technical concept to someone new to it",
                "Set up a collaborative workspace for your team"
            ]
        },
        {
            "type": "technical",
            "difficulty": "medium",
            "templates": [
                "Build a quick integration between two different projects",
                "Create a reusable component and share it",
                "Mentor someone through their first API integration",
                "Set up a live demo environment for multiple teams",
                "Organize a code review session"
            ]
        },
        # Social Quests
        {
            "type": "social",
            "difficulty": "easy",
            "templates": [
                "Take a group photo with your new connections",
                "Share your hackathon experience on social media",
                "Join a team for a meal or coffee break",
                "Participate in a team building activity",
                "Share an interesting fact about yourself"
            ]
        },
        {
            "type": "social",
            "difficulty": "medium", 
            "templates": [
                "Organize a team lunch or dinner",
                "Create a shared playlist for your workspace",
                "Start a group discussion about work-life balance in tech",
                "Organize a quick team building game",
                "Share your hackathon journey in a creative way"
            ]
        },
        # Creative Quests
        {
            "type": "creative",
            "difficulty": "easy",
            "templates": [
                "Create a fun team name and logo",
                "Design a quick presentation for your project",
                "Write a creative project description",
                "Create a team motto or catchphrase",
                "Design a simple wireframe for your idea"
            ]
        },
        {
            "type": "creative",
            "difficulty": "medium",
            "templates": [
                "Create a demo video of your project",
                "Design a pitch deck for your solution",
                "Write a blog post about your hackathon experience",
                "Create a visual diagram of your system architecture",
                "Design a user journey map for your solution"
            ]
        }
    ]
    
    # Generate 5 random quests
    quests = []
    for i in range(5):
        # Randomly select a quest category
        category = random.choice(quest_templates)
        template = random.choice(category["templates"])
        
        # Generate reward based on type and difficulty
        reward = generate_quest_reward(category["type"], category["difficulty"])
        
        quest = {
            "quest_id": f"batch_quest_{i}_{random.randint(1000, 9999)}",
            "type": category["type"],
            "difficulty": category["difficulty"],
            "description": template,
            "reward": reward,
            "status": "pending",  # User needs to choose keep/remove
            "created_at": datetime.now().isoformat()
        }
        
        quests.append(quest)
    
    return quests
