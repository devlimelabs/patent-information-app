#!/bin/bash

# Edison - Meilisearch AWS Setup Script
# This script helps set up a Meilisearch instance on AWS EC2

# Exit on error
set -e

# Configuration variables - modify these as needed
INSTANCE_TYPE="t3.medium"
REGION="us-east-1"
VOLUME_SIZE="100"
KEY_NAME="edison-key"
SECURITY_GROUP_NAME="edison-meilisearch-sg"
INSTANCE_NAME="edison-meilisearch"
MASTER_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

echo "=== Edison Meilisearch AWS Setup ==="
echo "This script will set up a Meilisearch instance on AWS EC2."
echo "Region: $REGION"
echo "Instance Type: $INSTANCE_TYPE"
echo "Volume Size: ${VOLUME_SIZE}GB"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws configure list &> /dev/null; then
    echo "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "Creating security group..."
SG_ID=$(aws ec2 create-security-group \
    --group-name "$SECURITY_GROUP_NAME" \
    --description "Security group for Edison Meilisearch" \
    --region "$REGION" \
    --output text \
    --query 'GroupId')

echo "Configuring security group rules..."
aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region "$REGION"

aws ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp \
    --port 7700 \
    --cidr 0.0.0.0/0 \
    --region "$REGION"

echo "Creating EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ami-0c7217cdde317cfec \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --block-device-mappings "[{\"DeviceName\":\"/dev/sda1\",\"Ebs\":{\"VolumeSize\":$VOLUME_SIZE,\"VolumeType\":\"gp3\"}}]" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --region "$REGION" \
    --output text \
    --query 'Instances[0].InstanceId')

echo "Waiting for instance to be running..."
aws ec2 wait instance-running \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION"

echo "Allocating Elastic IP..."
ALLOCATION_ID=$(aws ec2 allocate-address \
    --domain vpc \
    --region "$REGION" \
    --output text \
    --query 'AllocationId')

echo "Associating Elastic IP with instance..."
aws ec2 associate-address \
    --instance-id "$INSTANCE_ID" \
    --allocation-id "$ALLOCATION_ID" \
    --region "$REGION"

PUBLIC_IP=$(aws ec2 describe-addresses \
    --allocation-ids "$ALLOCATION_ID" \
    --region "$REGION" \
    --output text \
    --query 'Addresses[0].PublicIp')

echo "Waiting for instance to be ready..."
sleep 60

echo "Generating user data script..."
cat > meilisearch-setup.sh << EOF
#!/bin/bash
# Update system
apt-get update && apt-get upgrade -y

# Install Meilisearch
curl -L https://install.meilisearch.com | sh

# Configure as a service
mv ./meilisearch /usr/bin/
useradd -d /var/lib/meilisearch -b /bin/false meilisearch
mkdir -p /var/lib/meilisearch
chown -R meilisearch:meilisearch /var/lib/meilisearch

# Create systemd service
cat > /etc/systemd/system/meilisearch.service << EOT
[Unit]
Description=Meilisearch
After=systemd-user-sessions.service

[Service]
Type=simple
ExecStart=/usr/bin/meilisearch --http-addr 0.0.0.0:7700 --env production --master-key $MASTER_KEY
Environment="MEILI_DATA_PATH=/var/lib/meilisearch"
User=meilisearch
Group=meilisearch
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOT

# Enable and start service
systemctl enable meilisearch
systemctl start meilisearch

# Set up monitoring
apt-get install -y amazon-cloudwatch-agent

# Create CloudWatch config
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOT
{
  "metrics": {
    "namespace": "Edison/Meilisearch",
    "metrics_collected": {
      "cpu": {
        "resources": ["*"],
        "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"]
      },
      "mem": {
        "measurement": ["mem_used_percent"]
      },
      "disk": {
        "resources": ["/"],
        "measurement": ["disk_used_percent"]
      }
    }
  }
}
EOT

# Start CloudWatch agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
EOF

echo "Copying setup script to instance..."
scp -o StrictHostKeyChecking=no -i "$KEY_NAME.pem" meilisearch-setup.sh ubuntu@$PUBLIC_IP:~/

echo "Running setup script on instance..."
ssh -o StrictHostKeyChecking=no -i "$KEY_NAME.pem" ubuntu@$PUBLIC_IP "sudo bash ~/meilisearch-setup.sh"

echo "=== Setup Complete ==="
echo "Meilisearch is now running on: http://$PUBLIC_IP:7700"
echo "Master Key: $MASTER_KEY"
echo ""
echo "Add these values to your environment configuration:"
echo ""
echo "meilisearch: {"
echo "  host: \"http://$PUBLIC_IP:7700\","
echo "  apiKey: \"$MASTER_KEY\""
echo "}"
echo ""
echo "Important: Save the Master Key in a secure location!"
