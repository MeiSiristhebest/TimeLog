#!/bin/bash
# TimeLog Agent Setup Script

set -e

echo "🎯 TimeLog Story Agent - Setup Script"
echo "====================================="
echo ""

# Check Python version
echo "1️⃣  Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
required_version="3.12"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Python 3.12+ required. Found: $python_version"
    exit 1
fi
echo "✅ Python $python_version"

# Create virtual environment
echo ""
echo "2️⃣  Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "3️⃣  Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"

# Install dependencies
echo ""
echo "4️⃣  Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Dependencies installed"

# Check for .env file
echo ""
echo "5️⃣  Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "📋 Creating .env from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your API keys:"
    echo "   - LIVEKIT_API_SECRET"
    echo "   - DEEPGRAM_API_KEY"
    echo "   - GEMINI_API_KEY"
    echo ""
    echo "Run: nano .env  (or use your preferred editor)"
else
    echo "✅ .env file exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys: nano .env"
echo "  2. Activate the virtual environment: source venv/bin/activate"
echo "  3. Run the agent: python story_agent.py start"
echo ""
echo "For more information, see README.md"
