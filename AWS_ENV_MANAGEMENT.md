# AWS EC2 Environment Variables Management Guide

## Overview

This guide shows you how to securely manage and update environment variables for your CSE DIU Alumni API hosted on AWS EC2.

## Quick Methods

### Method 1: Direct File Edit (Development/Testing)

**Steps:**

```bash
# 1. SSH into your EC2 instance
ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip

# 2. Navigate to application directory
cd /home/ubuntu/csediualumni-services  # or your app path

# 3. Edit .env file
nano .env

# 4. Make your changes, then save (Ctrl+O, Enter, Ctrl+X)

# 5. Restart the application
pm2 restart csediualumni-api  # if using PM2
# OR
sudo systemctl restart csediualumni-api  # if using systemd
# OR
npm run start:prod  # manual restart
```

**Pros:** Quick and simple  
**Cons:** Not secure for production, manual process

---

### Method 2: Using SCP to Upload .env (Quick Update)

**From your local machine:**

```bash
# Upload your local .env to EC2
scp -i /path/to/your-key.pem .env ubuntu@your-ec2-ip:/home/ubuntu/csediualumni-services/.env

# SSH and restart
ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip
cd /home/ubuntu/csediualumni-services
pm2 restart csediualumni-api
```

**Pros:** Quick, maintains local config  
**Cons:** Still stores secrets in file

---

### Method 3: AWS Systems Manager Parameter Store (Recommended)

**Setup (One-time):**

1. **Store your secrets in Parameter Store:**

```bash
# Install AWS CLI if not installed
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials (on EC2 or locally)
aws configure

# Store each secret (RECOMMENDED METHOD)
aws ssm put-parameter \
  --name "/csediualumni/production/JWT_SECRET" \
  --value "your-actual-jwt-secret" \
  --type "SecureString" \
  --region us-east-1

aws ssm put-parameter \
  --name "/csediualumni/production/MONGODB_URI" \
  --value "your-mongodb-connection-string" \
  --type "SecureString" \
  --region us-east-1

aws ssm put-parameter \
  --name "/csediualumni/production/GOOGLE_CLIENT_ID" \
  --value "your-google-client-id" \
  --type "SecureString" \
  --region us-east-1

aws ssm put-parameter \
  --name "/csediualumni/production/GOOGLE_CLIENT_SECRET" \
  --value "your-google-client-secret" \
  --type "SecureString" \
  --region us-east-1

aws ssm put-parameter \
  --name "/csediualumni/production/EMAIL_USER" \
  --value "your-email@gmail.com" \
  --type "SecureString" \
  --region us-east-1

aws ssm put-parameter \
  --name "/csediualumni/production/EMAIL_PASSWORD" \
  --value "your-email-app-password" \
  --type "SecureString" \
  --region us-east-1
```

2. **Grant EC2 IAM role permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      "Resource": "arn:aws:ssm:us-east-1:YOUR-ACCOUNT-ID:parameter/csediualumni/*"
    },
    {
      "Effect": "Allow",
      "Action": ["kms:Decrypt"],
      "Resource": "*"
    }
  ]
}
```

3. **Use the provided script on EC2:**

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Navigate to app directory
cd /home/ubuntu/csediualumni-services

# Make script executable
chmod +x scripts/load-env-from-ssm.sh

# Create a startup script
cat > start-app.sh << 'EOF'
#!/bin/bash
source ./scripts/load-env-from-ssm.sh
npm run start:prod
EOF

chmod +x start-app.sh

# Use with PM2
pm2 delete csediualumni-api
pm2 start start-app.sh --name csediualumni-api
pm2 save
```

**To update a parameter:**

```bash
aws ssm put-parameter \
  --name "/csediualumni/production/JWT_SECRET" \
  --value "new-value" \
  --type "SecureString" \
  --overwrite \
  --region us-east-1

# Then restart your app on EC2
ssh -i your-key.pem ubuntu@your-ec2-ip
pm2 restart csediualumni-api
```

**Pros:** Secure, centralized, version controlled  
**Cons:** Requires IAM setup, AWS CLI

---

### Method 4: AWS Secrets Manager (Best for Production)

**Setup:**

1. **Create secret with all env vars:**

```bash
# Create a JSON file with all your env vars
cat > secrets.json << 'EOF'
{
  "NODE_ENV": "production",
  "PORT": "3000",
  "MONGODB_URI": "your-mongodb-uri",
  "JWT_SECRET": "your-jwt-secret",
  "JWT_EXPIRATION": "1d",
  "GOOGLE_CLIENT_ID": "your-client-id",
  "GOOGLE_CLIENT_SECRET": "your-client-secret",
  "GOOGLE_CALLBACK_URL": "https://api.csediualumni.com/auth/google/callback",
  "EMAIL_HOST": "smtp.gmail.com",
  "EMAIL_PORT": "587",
  "EMAIL_SECURE": "false",
  "EMAIL_USER": "your-email@gmail.com",
  "EMAIL_PASSWORD": "your-app-password",
  "EMAIL_FROM": "CSE DIU Alumni <noreply@csediualumni.com>",
  "FRONTEND_URL": "https://csediualumni.com"
}
EOF

# Create the secret
aws secretsmanager create-secret \
  --name csediualumni/production/env \
  --secret-string file://secrets.json \
  --region us-east-1

# Remove local file
rm secrets.json
```

2. **Grant EC2 IAM permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:us-east-1:YOUR-ACCOUNT-ID:secret:csediualumni/production/env-*"
    }
  ]
}
```

3. **Use on EC2:**

```bash
# Make scripts executable
chmod +x scripts/load-env-from-secrets.sh
chmod +x scripts/sync-env-to-secrets.sh

# Load and start
source ./scripts/load-env-from-secrets.sh
npm run start:prod

# Or with PM2
pm2 start npm --name csediualumni-api -- run start:prod
```

**To update:**

```bash
# Update the secret
aws secretsmanager update-secret \
  --secret-id csediualumni/production/env \
  --secret-string '{"JWT_SECRET":"new-value","MONGODB_URI":"..."}' \
  --region us-east-1

# Restart app on EC2
pm2 restart csediualumni-api
```

**Pros:** Most secure, automatic rotation, audit logging  
**Cons:** Costs money ($0.40/secret/month + $0.05/10k API calls)

---

## Method 5: Using .env with Environment-Specific Files

**Structure:**

```
.env.production
.env.staging
.env.development
```

**On EC2:**

```bash
# Copy the appropriate env file
cp .env.production .env

# Or use NODE_ENV
export NODE_ENV=production
node -r dotenv/config dist/main.js
```

---

## Setting Up EC2 IAM Role (Required for AWS Methods)

1. **In AWS Console:**
   - Go to IAM → Roles → Create Role
   - Select "AWS Service" → "EC2"
   - Attach policies: `AmazonSSMReadOnlyAccess` or custom policy above
   - Name: `csediualumni-ec2-role`

2. **Attach to EC2:**
   - Go to EC2 → Instances
   - Select your instance
   - Actions → Security → Modify IAM Role
   - Select `csediualumni-ec2-role`

---

## Using PM2 with Environment Variables

**Method 1: ecosystem.config.js**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'csediualumni-api',
      script: 'dist/main.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Other non-secret vars
      },
    },
  ],
};

// Start with: pm2 start ecosystem.config.js --env production
```

**Method 2: PM2 with dotenv**

```bash
pm2 start npm --name csediualumni-api -- run start:prod
pm2 save
```

**Method 3: PM2 with AWS Secrets**

```bash
# Create wrapper script
cat > start-with-secrets.sh << 'EOF'
#!/bin/bash
source ./scripts/load-env-from-secrets.sh
node dist/main.js
EOF

chmod +x start-with-secrets.sh
pm2 start start-with-secrets.sh --name csediualumni-api
pm2 save
```

---

## Systemd Service with Environment Variables

**Create service file:**

```bash
sudo nano /etc/systemd/system/csediualumni-api.service
```

**Content:**

```ini
[Unit]
Description=CSE DIU Alumni API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/csediualumni-services
EnvironmentFile=/home/ubuntu/csediualumni-services/.env
ExecStart=/usr/bin/npm run start:prod
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Or with AWS Secrets:**

```ini
[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/csediualumni-services
ExecStartPre=/bin/bash /home/ubuntu/csediualumni-services/scripts/load-env-from-secrets.sh
ExecStart=/usr/bin/npm run start:prod
Restart=on-failure
```

**Enable and start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable csediualumni-api
sudo systemctl start csediualumni-api
sudo systemctl status csediualumni-api
```

---

## Best Practices

### ✅ DO:

- Use AWS Secrets Manager or Parameter Store for production
- Rotate secrets regularly
- Use IAM roles instead of access keys
- Keep different secrets for dev/staging/prod
- Enable secret versioning
- Use HTTPS for all API endpoints
- Monitor secret access with CloudTrail

### ❌ DON'T:

- Commit .env files to git
- Share .env files via email/slack
- Use same secrets across environments
- Store secrets in code or comments
- Use weak JWT secrets
- Expose secrets in logs or error messages

---

## Quick Commands Reference

```bash
# View current env on EC2
ssh -i key.pem ubuntu@ec2-ip 'cat /home/ubuntu/csediualumni-services/.env'

# Test AWS credentials on EC2
ssh -i key.pem ubuntu@ec2-ip 'aws sts get-caller-identity'

# Check PM2 env vars
ssh -i key.pem ubuntu@ec2-ip 'pm2 env 0'

# View PM2 logs
ssh -i key.pem ubuntu@ec2-ip 'pm2 logs csediualumni-api --lines 50'

# Restart app
ssh -i key.pem ubuntu@ec2-ip 'cd /home/ubuntu/csediualumni-services && pm2 restart csediualumni-api'

# View systemd logs
ssh -i key.pem ubuntu@ec2-ip 'sudo journalctl -u csediualumni-api -n 50'
```

---

## Troubleshooting

### Issue: "Cannot connect to MongoDB"

```bash
# Check if MONGODB_URI is set
ssh -i key.pem ubuntu@ec2-ip
echo $MONGODB_URI  # Should show your connection string

# If empty, check .env file or AWS secrets
cat .env | grep MONGODB_URI
```

### Issue: "JWT secret not defined"

```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Check length (should be 32+ characters)
echo -n $JWT_SECRET | wc -c
```

### Issue: "AWS credentials not found"

```bash
# Check IAM role is attached
aws sts get-caller-identity

# If error, attach IAM role in AWS Console
```

### Issue: App not restarting

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs csediualumni-api --err

# Full restart
pm2 delete csediualumni-api
pm2 start npm --name csediualumni-api -- run start:prod
pm2 save
```

---

## Security Checklist

- [ ] .env file has restricted permissions (chmod 600)
- [ ] .env is in .gitignore
- [ ] Using AWS Secrets Manager or Parameter Store
- [ ] EC2 has IAM role (no access keys in files)
- [ ] Secrets are different for each environment
- [ ] JWT_SECRET is 64+ characters
- [ ] MongoDB uses strong password
- [ ] Email uses app-specific password
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Security groups allow only necessary ports
- [ ] CloudWatch logging enabled

---

## My Recommendation

For **production**, use this order of preference:

1. **AWS Secrets Manager** (best security, automatic rotation)
2. **AWS Systems Manager Parameter Store** (good security, free)
3. **Direct .env file** with strict permissions (only for small projects)

For your case, I recommend **AWS Systems Manager Parameter Store** because:

- It's free
- Secure with encryption
- Easy IAM integration
- Version controlled
- Good for your scale

Use the scripts I created:

- `scripts/load-env-from-ssm.sh` - Load vars on EC2
- `scripts/sync-env-to-secrets.sh` - Upload from local (if using Secrets Manager)

Let me know which method you'd like to implement, and I can help you set it up!
