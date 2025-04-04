// Production environment configuration

export const environment = {
  production: true,
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "edison-patent-app.firebaseapp.com",
    projectId: "edison-patent-app",
    storageBucket: "edison-patent-app.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  },
  meilisearch: {
    host: "https://your-aws-instance-ip:7700", // AWS Meilisearch instance
    apiKey: "YOUR_MEILISEARCH_API_KEY"
  },
  patentsView: {
    apiUrl: "https://search.patentsview.org/api/v1/",
    apiKey: "YOUR_PATENTSVIEW_API_KEY"
  },
  epo: {
    apiUrl: "https://ops.epo.org/3.2/",
    clientId: "YOUR_EPO_CLIENT_ID",
    clientSecret: "YOUR_EPO_CLIENT_SECRET"
  },
  vertexAi: {
    endpoint: "https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/text-bison:predict",
    apiKey: "YOUR_VERTEX_AI_API_KEY",
    enabled: false // Set to true when API key is configured
  }
};
