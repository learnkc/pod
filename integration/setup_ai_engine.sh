#!/bin/bash
# setup_ai_engine.sh
# Script to set up the AI engine and its dependencies

echo "Setting up AI Engine..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Please install Python 3."
    exit 1
fi

# Create a virtual environment
echo "Creating Python virtual environment..."
python3 -m venv ai_engine_venv

# Activate the virtual environment
echo "Activating virtual environment..."
source ai_engine_venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r ai_engine/requirements.txt

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed. Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "Ollama is already installed."
fi

# Pull the Llama 3.1 model
echo "Pulling Llama 3.1 model (this may take a while)..."
ollama pull llama3.1:70b

echo "AI Engine setup complete!"
echo "You can now start the application with 'npm run dev'"