#!/bin/sh

ARIA2C_RPC_SERVER_PID=$(ps -ef | grep aria2c | grep -v grep | awk '{print $2}')

if [ -f "aria2.pid" ] && [ -z "$ARIA2C_RPC_SERVER_PID" ]; then
  ARIA2C_RPC_SERVER_PID=$(cat aria2.pid);
fi

if [ -z "$ARIA2C_RPC_SERVER_PID" ]; then
    ARIA2C_BUILD_NAME=aria2c.tar.bz2

    echo "Downloading Aria2c static build latest release from q3aql/aria2-static-builds"
    curl -s https://api.github.com/repos/q3aql/aria2-static-builds/releases/latest | grep "download_url" | grep "32bit-build1" | grep "tar" | cut -d : -f 2,3 | tr -d \" | wget -O $ARIA2C_BUILD_NAME -qi- - 

    echo "Extracting aria2c static build extract $ARIA2C_BUILD_NAME"
    tar xjf $ARIA2C_BUILD_NAME --strip-components=1 --wildcards **/aria2c **/ca-certificates.crt

    PWD="$(pwd)"

    echo -e "\nCurrent working directory, ${PWD}\n"

    echo -e "\nListing directory contents\n"
    ls -lah "${PWD}"

    RESULT=$?
    if [ $RESULT -ne 0 ]; then
        echo "Error occurred in extracting $ARIA2C_BUILD_NAME"
        exit 22 # terminate and indicate error
    fi

    echo "Extraction completed successfully"
    echo "Removing build extract $ARIA2C_BUILD_NAME"

    rm -f $ARIA2C_BUILD_NAME
    echo "Removed build extract $ARIA2C_BUILD_NAME"

    #converting static binaries to executables
    chmod +x aria2c

    mkdir "${PWD}/downloads"
    touch "${PWD}/aria_session.txt"

    mkdir -p "${PWD}/public/downloads"

    # nohup ./aria2c --conf-path=aria2c.config > /dev/null 2>&1 < /dev/null &
    # nohup ./aria2c --enable-rpc --rpc-listen-all --log=/app/public/aria2c.log --ca-certificate=/app/ca-certificates.crt --dir=/app/public/downloads --input-file=aria_session.txt --save-session=aria_session.txt --save-session-interval=3 --max-connection-per-server=16 > /dev/null 2>&1 < /dev/null &
    nohup ${PWD}/aria2c --enable-rpc --rpc-listen-all --log=${PWD}/public/aria2c.log --check-certificate=false --dir=${PWD}/public/downloads --input-file=aria_session.txt --save-session=aria_session.txt --save-session-interval=3 --max-connection-per-server=16 > /dev/null 2>&1 &
    
    ARIA2C_RPC_SERVER_PID=$!
    echo "Aria2c RPC server started with pid, $ARIA2C_RPC_SERVER_PID"
    echo "$ARIA2C_RPC_SERVER_PID" > aria2.pid
else
    echo "Aria2c RPC server already started with pid, $ARIA2C_RPC_SERVER_PID"
fi
