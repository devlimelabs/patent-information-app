# Edison - Patent Information Platform

Edison is a comprehensive patent information platform that simplifies patent search, validation, and documentation. Named after Thomas Edison, one of history's most prolific inventors with 1,093 US patents, our platform embodies the spirit of innovation and practical application of ideas.

## Features

- **Semantic Search**: Find relevant patents using natural language queries
- **Patent Validation**: Validate invention ideas against existing patents
- **Analytics Dashboard**: Gain insights into patent trends and technology landscapes
- **Document Creation**: Create patent-related documents with AI-assisted guidance

## Technology Stack

- **Frontend**: Angular 15 with Angular Universal (SSR)
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **Search Engine**: Meilisearch (hosted on AWS)
- **Data Sources**: PatentsView API, EPO OPS API, WIPO PATENTSCOPE

## Project Structure

```
edison/
├── src/                          # Angular application source
│   ├── app/                      # Application code
│   │   ├── core/                 # Core functionality
│   │   ├── shared/               # Shared components
│   │   ├── features/             # Feature modules
│   │   │   ├── home/             # Home page
│   │   │   ├── search/           # Search functionality
│   │   │   ├── patent-detail/    # Patent detail view
│   │   │   ├── about/            # About page
│   │   │   └── user/             # User management
│   ├── assets/                   # Static assets
│   ├── environments/             # Environment configurations
├── firebase/                     # Firebase configuration
│   ├── functions/                # Cloud Functions
├── server/                       # Server-side rendering
```

## Development Setup

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Angular CLI
- Firebase CLI

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-org/edison.git
   cd edison
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a Firebase project
   - Update `src/environments/environment.ts` with your Firebase configuration
   - Set up Meilisearch instance on AWS
   - Obtain API keys for PatentsView and EPO OPS

4. Run the development server:
   ```
   npm run dev:ssr
   ```

5. Open your browser and navigate to `http://localhost:4200`

## Deployment

### Firebase Deployment

1. Build the application:
   ```
   npm run build:ssr
   ```

2. Deploy to Firebase:
   ```
   firebase deploy
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- PatentsView for providing access to USPTO patent data
- European Patent Office for the Open Patent Services API
- WIPO for PATENTSCOPE data
