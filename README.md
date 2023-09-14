# j1tt3r.net

Source Code for website hosted on AWS.

[j1tt3r.net](https://www.j1tt3r.net)

### TODO

1. Tests
2. [Docs](https://github.com/jsdoc/jsdoc)
3. Webpack
4. Uglify
5. Terraform

### Reference - S3 Commands

##### Sync S3 Bucket

```shell
# Sync Bucket to Directory
aws s3 sync s3://j1tt3r.net site
```

```shell
# Sync Directory to Bucket (TODO: Validate)
aws s3 sync site s3://j1tt3r.net
```

##### Get Bucket Policy

```shell
aws s3api get-bucket-policy --bucket j1tt3r.net --query Policy | 
  python3 -c "import json, sys; print(json.load(sys.stdin))" | 
  json_pp
```

##### Get Bucket Logging Configuration

```shell
aws s3api get-bucket-logging --bucket j1tt3r.net
```
