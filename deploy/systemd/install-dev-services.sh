#!/usr/bin/env bash
set -euo pipefail

install -m 0644 /workspace/cosmos/deploy/systemd/cosmos-backend.service /etc/systemd/system/cosmos-backend.service
install -m 0644 /workspace/cosmos/deploy/systemd/cosmos-frontend.service /etc/systemd/system/cosmos-frontend.service
systemctl daemon-reload
systemctl enable cosmos-backend.service cosmos-frontend.service
systemctl restart cosmos-backend.service cosmos-frontend.service
systemctl --no-pager --full status cosmos-backend.service cosmos-frontend.service
