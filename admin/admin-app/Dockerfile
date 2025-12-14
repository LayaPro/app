# # Use official Node image
# FROM node:24

# WORKDIR /app

# # Install dependencies
# COPY package.json package-lock.json* ./
# RUN npm install

# # Copy the rest of the code (for production only)
# COPY . .


# # # Expose dev server port
# EXPOSE 5173

# # Start the dev server (for Vite)
# CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# admin/admin-app/Dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
