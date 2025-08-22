#!/usr/bin/env python3
"""
Environment loader utility for AI documentation scripts
Loads environment variables from .env.local files
"""

import os
from pathlib import Path

def load_env_file(env_file_path):
    """Load environment variables from a .env file."""
    if not os.path.exists(env_file_path):
        return False
    
    print(f"📄 Loading environment from: {env_file_path}")
    
    with open(env_file_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                # Remove quotes if present
                value = value.strip('"\'')
                os.environ[key] = value
    
    return True

def load_environment():
    """Load environment variables from .env.local files in order of preference."""
    project_root = Path(__file__).parent.parent
    
    # Try docs/.env.local first (where the docs server loads from)
    docs_env = project_root / 'docs' / '.env.local'
    if load_env_file(docs_env):
        return True
    
    # Fall back to project root .env.local
    root_env = project_root / '.env.local'
    if load_env_file(root_env):
        return True
    
    # Try .env as fallback
    env_file = project_root / '.env'
    if load_env_file(env_file):
        return True
    
    print("⚠️  No .env.local file found in docs/ directory or project root")
    return False

if __name__ == "__main__":
    # Test the loader
    load_environment()
    
    vite_key = os.getenv('VITE_OPENAI_API_KEY')
    if vite_key:
        print(f"✅ VITE_OPENAI_API_KEY loaded (length: {len(vite_key)})")
    else:
        print("❌ VITE_OPENAI_API_KEY not found")
