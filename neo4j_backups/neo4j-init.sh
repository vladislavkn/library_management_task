#!/bin/bash
if [ ! -d "/data/databases/neo4j" ]; then
  echo "Restoring Neo4j database from dump..."
  neo4j-admin database load neo4j --from-path=/backups --overwrite-destination=true
else
  echo "Neo4j database already exists. Skipping restore."
fi
