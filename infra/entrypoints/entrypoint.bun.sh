#!/bin/sh

yarn db:migration:up:prod
bun run start:bun
