#!/bin/bash

mkdir -p ./src/_proto/cloudstate
mkdir -p ./src/_proto/google/api

echo "Compiling protobuf definitions"

OUT_DIR="./src/_proto"
PROTOC_GEN_TS_PATH="./node_modules/.bin/protoc-gen-ts"


echo "Compile cloudstate entity key"
echo "httpbody.proto"
protoc \
    --proto_path="node_modules/cloudstate/protoc/include/" \
    --proto_path="node_modules/cloudstate/proto/google/api/" \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --js_out="import_style=commonjs,binary:${OUT_DIR}" \
    --ts_out="service=grpc-web:${OUT_DIR}/google/api" \
    node_modules/cloudstate/proto/google/api/httpbody.proto

echo "http.proto"
protoc \
    --proto_path="node_modules/cloudstate/proto/google/api/" \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --js_out="import_style=commonjs,binary:${OUT_DIR}/google/api" \
    --ts_out="service=grpc-web:${OUT_DIR}/google/api" \
    node_modules/cloudstate/proto/google/api/http.proto

echo "annotations.proto"
protoc \
    --proto_path="node_modules/cloudstate/protoc/include/" \
    --proto_path="node_modules/cloudstate/proto/" \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --js_out="import_style=commonjs,binary:${OUT_DIR}" \
    --ts_out="service=grpc-web:${OUT_DIR}" \
    node_modules/cloudstate/proto/google/api/annotations.proto

echo "entity_key.proto"
protoc \
    --proto_path="node_modules/cloudstate/protoc/include/" \
    --proto_path="node_modules/cloudstate/proto/cloudstate/" \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --js_out="import_style=commonjs,binary:${OUT_DIR}/cloudstate" \
    --ts_out="service=grpc-web:${OUT_DIR}/cloudstate" \
    node_modules/cloudstate/proto/cloudstate/entity_key.proto

echo "eventing.proto"
protoc \
    --proto_path="node_modules/cloudstate/protoc/include/" \
    --proto_path="node_modules/cloudstate/proto/cloudstate/" \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --js_out="import_style=commonjs,binary:${OUT_DIR}/cloudstate" \
    --ts_out="service=grpc-web:${OUT_DIR}/cloudstate" \
    node_modules/cloudstate/proto/cloudstate/eventing.proto

echo "Compiling Shop Service"
protoc \
  --proto_path="node_modules/cloudstate/proto/" \
  --include_imports \
  --proto_path=node_modules/cloudstate/proto \
  --proto_path=node_modules/cloudstate/protoc/include \
  --descriptor_set_out=user-function.desc \
  --proto_path=. \
  shop.proto

echo "Compile Cart Service"
protoc \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --js_out="import_style=commonjs,binary:${OUT_DIR}" \
    --ts_out="service=grpc-web:${OUT_DIR}" \
    --proto_path="../js-shopping-cart" \
    -I node_modules/cloudstate/proto/google/api/ \
    -I node_modules/cloudstate/proto/ \
    -I ./node_modules/cloudstate/protoc/include \
    ../js-shopping-cart/shoppingcart.proto
