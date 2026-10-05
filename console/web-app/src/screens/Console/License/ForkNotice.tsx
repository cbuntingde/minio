//  This file is part of MinIO Console Server
//  Copyright (c) 2026 the cbuntingde/minio-console contributors
//
//  Derived from MinIO Console, Copyright (c) 2021 MinIO, Inc.
//  Licensed under the GNU Affero General Public License, version 3.
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <http://www.gnu.org/licenses/>.

import React from "react";
import { Box } from "mds";

const REPO_URL = "https://github.com/cbuntingde/minio";
const CONSOLE_REPO_URL = "https://github.com/cbuntingde/minio-console";
const FORK_DOCS_URL = "https://github.com/cbuntingde/minio/tree/master/docs";
const ISSUES_URL = "https://github.com/cbuntingde/minio/issues";
const IMAGE_URL = "https://github.com/users/cbuntingde/packages/container/minio";

// Mirrors docs/fork.md in cbuntingde/minio. Keep the two in step: that file is
// the authority, this is only a summary of it for someone reading the console.
const CHANGES: Array<[string, string]> = [
  [
    "Go toolchain",
    "Rebuilt on Go 1.26.8, up from 1.24.8, clearing roughly 20 reachable vulnerabilities in the Go standard library.",
  ],
  [
    "Dependencies",
    "Ten or more modules upgraded, removing 55 vulnerabilities reachable from MinIO code, including 14 in golang.org/x/crypto/ssh that were reachable through the embedded SFTP server.",
  ],
  [
    "CORS defaults",
    "The default policy no longer reflects arbitrary origins with credentials. It is now a non-credentialed wildcard. This is a behaviour change; see the configuration docs before upgrading.",
  ],
  [
    "Self-updater",
    "Disabled. mc admin update would fetch frozen, unpatched binaries from dl.min.io and silently undo the security work. Upgrade by pulling a newer image instead.",
  ],
  [
    "CI gate",
    "govulncheck runs on every push and pull request, so a reachable vulnerability fails the build rather than shipping.",
  ],
];

const ForkNotice = () => (
  <Box
    sx={{
      margin: "30px 30px 0",
      padding: "20px 24px",
      borderRadius: 10,
      border: "1px solid #EAEAEA",
    }}
  >
    <Box sx={{ fontWeight: 600, fontSize: 16, mb: 1 }}>
      This is a community fork, not MinIO, Inc. software
    </Box>
    <Box sx={{ fontSize: 14, lineHeight: 1.5, mb: 2 }}>
      The upstream MinIO community repository was archived in 2024 and no
      longer receives security updates for its code, its dependencies, or its Go
      toolchain. This deployment runs a security-first maintenance fork,{" "}
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
        cbuntingde/minio
      </a>
      , built and published as{" "}
      <code>ghcr.io/cbuntingde/minio</code>. It is not affiliated with,
      endorsed by, or supported by MinIO, Inc. See{" "}
      <a href={FORK_DOCS_URL} target="_blank" rel="noopener noreferrer">
        the fork documentation
      </a>{" "}
      for the full description.
    </Box>

    <Box sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>
      What the fork changes
    </Box>
    <ul style={{ margin: 0, paddingLeft: 24, fontSize: 14, lineHeight: 1.5 }}>
      {CHANGES.map(([label, detail]) => (
        <li key={label} style={{ marginBottom: 4 }}>
          <strong>{label}</strong>: {detail}
        </li>
      ))}
    </ul>

    <Box sx={{ fontWeight: 600, fontSize: 14, mt: 2, mb: 1 }}>
      What the fork does not add
    </Box>
    <Box sx={{ fontSize: 14, lineHeight: 1.5, mb: 2 }}>
      No features from the commercial AIStor product have been backported. This
      is a maintenance fork: it keeps the archived community edition secure and
      buildable, and stays a drop-in S3-compatible replacement. If you need
      AIStor capabilities, use the commercial product rather than this image.
    </Box>

    <Box sx={{ fontSize: 13, lineHeight: 1.5 }}>
      Licensed under the GNU AGPLv3, the same as upstream. Support is
      community-driven through{" "}
      <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
        GitHub issues
      </a>
      . No warranty is offered; running this software is at your own risk.{" "}
      Console source:{" "}
      <a href={CONSOLE_REPO_URL} target="_blank" rel="noopener noreferrer">
        cbuntingde/minio-console
      </a>
      . Images and digests:{" "}
      <a href={IMAGE_URL} target="_blank" rel="noopener noreferrer">
        GHCR package
      </a>
      .
    </Box>
  </Box>
);

export default ForkNotice;
