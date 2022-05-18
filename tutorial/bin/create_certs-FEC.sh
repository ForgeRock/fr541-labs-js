mkdir -p certs

# Generate the root key
openssl genrsa -des3 -out certs/fec-ca.key 2048

# Create a CA configuration file
echo \
"FQDN = forgerock-fec-ca.com
ORGNAME = ForgeRock FEC CA
ALTNAMES = DNS:\$FQDN

[ req ]
default_bits = 2048
default_md = sha256
prompt = no
encrypt_key = no
distinguished_name = dn
req_extensions = req_ext

[ dn ]
C = US
O = \$ORGNAME
CN = \$FQDN

[ req_ext ]
subjectAltName = \$ALTNAMES
"> certs/fec-ca.conf

# Generate a root certificate based on the root key
openssl req -x509 -new -nodes -key certs/fec-ca.key -sha256 -days 1825 \
  -out certs/fec-ca.crt -config certs/fec-ca.conf

# Generate a new private key
openssl genrsa -out certs/fec.key 2048

# Create a CSR configuration file
echo \
"FQDN = fec.example.com
ORGNAME = ForgeRock FEC SDK
ALTNAMES = DNS:\$FQDN

[ req ]
default_bits = 2048
default_md = sha256
prompt = no
encrypt_key = no
distinguished_name = dn
req_extensions = req_ext

[ dn ]
C = US
O = \$ORGNAME
CN = \$FQDN

[ req_ext ]
subjectAltName = \$ALTNAMES
"> certs/fec-csr.conf

# Generate a Certificate Signing Request (CSR) based on that private key
openssl req -new -key certs/fec.key -out certs/fec.csr \
  -config certs/fec-csr.conf

# Create a configuration-file
echo \
"authorityKeyIdentifier = keyid,issuer
basicConstraints        = CA:FALSE
keyUsage                = digitalSignature,nonRepudiation,keyEncipherment,dataEncipherment
subjectAltName          = @alt_names

[alt_names]
DNS.1                   = *.example.com
"> certs/fec-crt.conf

# Create the certificate for the webserver to serve
openssl x509 -req -in certs/fec.csr -CA certs/fec-ca.crt -CAkey \
  certs/fec-ca.key -CAcreateserial -out certs/fec.crt \
  -days 1825 -sha256 -extfile certs/fec-crt.conf
