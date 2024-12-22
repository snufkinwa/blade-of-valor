FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install cross-compilation tools, Python, and libraries
RUN dpkg --add-architecture amd64 && \
    apt-get update && apt-get install -y \
    g++-x86-64-linux-gnu \
    libc6-dev-amd64-cross \
    python3.11 \
    python3-pip \
    python3-venv \
    git \
    make \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone the Stockfish repository
RUN git clone https://github.com/official-stockfish/Stockfish.git

# Build Stockfish for x86-64
RUN cd Stockfish/src && \
    make build ARCH=x86-64 COMP=gcc CXX=x86_64-linux-gnu-g++ && \
    cp stockfish /usr/local/bin/ && \
    cd /app && \
    rm -rf Stockfish

# Set up Python virtual environment and install dependencies
COPY requirements.txt .
RUN python3 -m venv venv && \
    . venv/bin/activate && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 5328

# Run FastAPI with Uvicorn
CMD ["/app/venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5328"]
