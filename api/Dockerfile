FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN wget https://github.com/official-stockfish/Stockfish/releases/latest/download/stockfish-ubuntu-x86-64-avx2.tar && \
    tar xf stockfish-ubuntu-x86-64-avx2.tar && \
    mv stockfish /usr/local/bin/ && \
    chmod +x /usr/local/bin/stockfish && \
    rm stockfish-ubuntu-x86-64-avx2.tar

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]