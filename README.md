[![CI](https://github.com/factoryiq-ch/n8n-nodes-fiq-influxdb/actions/workflows/ci.yml/badge.svg)](https://github.com/factoryiq-ch/n8n-nodes-fiq-influxdb/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@factoryiq/n8n-nodes-fiq-influxdb.svg)](https://www.npmjs.com/package/@factoryiq/n8n-nodes-fiq-influxdb)
[![GitHub release](https://img.shields.io/github/v/release/factoryiq-ch/n8n-nodes-fiq-influxdb)](https://github.com/factoryiq-ch/n8n-nodes-fiq-influxdb/releases)

<p align="center">
  <img src="credentials/FactoryIQ.svg" alt="FactoryIQ Logo" width="200"/>
</p>

# n8n-nodes-fiq-influxdb

**FactoryIQ InfluxDB v3 Node for n8n**

This n8n community node provides comprehensive integration with InfluxDB v3, supporting both data ingestion via line protocol and advanced querying capabilities with SQL. Built following n8n community standards with no external dependencies.

---

## 🚀 Quick Start

### Installation

Install as a standard n8n custom node package:

```bash
npm install @factoryiq/n8n-nodes-fiq-influxdb
```

For detailed instructions on installing community nodes in n8n, see the official n8n documentation: [Install and manage community nodes](https://docs.n8n.io/integrations/community-nodes/installation/)

### Usage

Import and use this custom node in your n8n instance. See the [n8n documentation](https://docs.n8n.io/) for details on using custom nodes.

---

## Features

- **Data Writing**: Write time-series data using InfluxDB line protocol format
- **Advanced Querying**: Execute SQL queries with multiple response formats
- **Query Bookmarking**: Predefined query templates for common use cases
- **Parameterized Queries**: Support for dynamic query parameters
- **Multiple Response Formats**: JSON, JSONL, CSV, Pretty Print, and Parquet
- **System Information**: Database schema exploration and query performance monitoring
- **Zero External Dependencies**: Built using only n8n-workflow APIs for maximum compatibility

---

## Configuration

### Credentials

Create InfluxDB API credentials with the following information:

- **Endpoint**: Your InfluxDB v3 instance URL 
  - InfluxDB v3 Core: `http://localhost:8181`
  - InfluxDB v3 Cloud: `https://your-instance.influxdata.com`
- **Token**: API token for authentication
- **Database**: Target database name
- **Organization**: Organization name (optional, required for Cloud instances)

For detailed setup instructions, see the [InfluxDB v3 Documentation](https://docs.influxdata.com/influxdb3/):
- [InfluxDB v3 Core Authentication](https://docs.influxdata.com/influxdb3/core/get-started/authenticate/)
- [InfluxDB v3 Cloud Authentication](https://docs.influxdata.com/influxdb/cloud/security/tokens/)

### Operations

#### Write Data

Write time-series data using line protocol format:

```
measurement,tag1=value1,tag2=value2 field1=123.45,field2="string_value" 1609459200000000000
```

**Example:**
```
temperature,location=room1,sensor=A1 value=23.5,humidity=45.2 1609459200000000000
pressure,location=boiler1 value=101325 1609459200000000000
```

#### Query Data

Execute SQL queries with multiple options:

- **Custom Query**: Write your own SQL queries
- **Bookmarked Query**: Use predefined templates

**Query Language Support:**
- **SQL**: Full support using InfluxDB v3 native SQL engine

### Query Bookmarks

#### System Information

Database management queries:

1. **Show All Tables**: List available measurements
2. **Recent Query Performance**: Monitor query execution
3. **Table Schema Information**: Explore table structures

### Response Formats

- **JSON Lines (JSONL)**: Streaming format for large datasets (recommended)
- **JSON**: Standard JSON format
- **CSV**: Comma-separated values for data analysis
- **Pretty Print**: Human-readable formatted output
- **Parquet**: Binary format for data warehousing

### Query Parameters

Use parameterized queries for dynamic execution:

```sql
SELECT * FROM $table_name WHERE timestamp >= NOW() - INTERVAL '$time_range'
```

Parameters:
- `table_name`: `boiler_measurements`
- `time_range`: `1 hour`

---

## Architecture

This package provides:
- ✅ **No external dependencies** - compliant with n8n verification guidelines
- ✅ **Native InfluxDB v3 support** - SQL queries and line protocol writes
- ✅ **Multiple response formats** - JSON, JSONL, CSV, Pretty Print, and Parquet
- ✅ **Query management** - bookmarks and parameterized queries
- ✅ **System monitoring** - database schema exploration and performance monitoring

---

## Usage Examples

### Writing Time-Series Data

```javascript
// Line Protocol for sensor measurements
const lineProtocol = `temperature,location=room1,sensor=A1 ` +
  `value=23.5,humidity=45.2 ` +
  `${Date.now() * 1000000}`;
```

### Querying Recent Data

```sql
SELECT 
  timestamp,
  location,
  sensor,
  value,
  humidity
FROM temperature 
WHERE timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC
LIMIT 100
```

### Monitoring System Performance

```sql
SELECT 
  id, 
  query_text, 
  plan_duration, 
  execute_duration, 
  end2end_duration, 
  success 
FROM system.queries 
ORDER BY issue_time DESC 
LIMIT 10
```

---

## Troubleshooting

### Connection Issues
- Verify endpoint URL format (include http/https)
- Check token permissions and expiration
- Ensure database exists and is accessible

### Query Errors
- Validate SQL syntax for InfluxDB v3
- Check parameter names and values
- Review response format compatibility

### Performance Issues
- Use LIMIT clauses for large datasets
- Consider time-based filtering
- Monitor query execution times

---

## Development

### Requirements
- Node.js 18.17.0 or later
- pnpm 8.1 or later
- No external dependencies (uses only n8n-workflow APIs)

### Building
```bash
pnpm install
pnpm build
```

### Linting
```bash
pnpm lint
pnpm lintfix
```

---

## Compatibility

| Package         | Version    | Link                                                      |
|----------------|------------|-----------------------------------------------------------|
| n8n            | 1.95.3     | [npm](https://www.npmjs.com/package/n8n)                  |
| n8n-workflow   | 1.82.0     | [npm](https://www.npmjs.com/package/n8n-workflow)         |
| Node.js        | 18.17.0    | [nodejs.org](https://nodejs.org/)                         |
| InfluxDB       | v3.x       | [InfluxDB v3 Documentation](https://docs.influxdata.com/influxdb3/) |

- This node is tested and supported on the above versions.
- Using other versions may result in unexpected behavior.

---

## Best Practices

1. **Use JSONL format** for large query results to improve performance
2. **Set appropriate timeouts** for long-running queries
3. **Use parameterized queries** for dynamic filtering
4. **Monitor query performance** using system.queries table
5. **Implement proper error handling** in your workflows

---

## Resources

- [NPM Package](https://www.npmjs.com/package/@factoryiq/n8n-nodes-fiq-influxdb)
- [GitHub Repository](https://github.com/factoryiq/fiq-n8n)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/#community-nodes)
- [InfluxDB v3 Documentation](https://docs.influxdata.com/influxdb3/)
- [InfluxDB v3 API Reference](https://docs.influxdata.com/influxdb3/core/api/)

---

## License

MIT License - see LICENSE.md for details.

---

## Maintainer

[FactoryIQ](https://factoryiq.io)

---

## API Reference

This node uses the InfluxDB v3 HTTP API:

- **Write Endpoint**: `/api/v3/write_lp` (line protocol data)
- **SQL Query Endpoint**: `/api/v3/query_sql` (SQL queries only)

For detailed API documentation, visit: https://docs.influxdata.com/influxdb3/core/api/

---

## Contributing

Please follow n8n community guidelines for node development:

1. Maintain backward compatibility
2. Include comprehensive error handling
3. Provide clear parameter descriptions
4. Add usage examples in documentation
5. Follow TypeScript best practices
6. Use only n8n-workflow APIs (no external dependencies)
