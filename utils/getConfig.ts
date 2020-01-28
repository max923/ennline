interface FirsebaseConfig {
  apiKey: string,
  authDomain: string,
  databaseURL: string,
  projectId: string,
  storageBucket: string,
  messagingSenderId: string,
}

interface ApiConfig {
  domain: string,
}

interface LineConfig {
  channelId: string,
  channelSecret: string,
  channelAccessToken: string,
}

function getConfig(process?: any): {
  Line: LineConfig,
  Api: ApiConfig,
  Firsebase: FirsebaseConfig,
}{  
  if(process.env.NODE_ENV === 'production') {
    const {
      channelId,
      channelSecret,
      channelAccessToken,
      domain,
      apiKey,
      authDomain,
      databaseURL,
      projectId,
      storageBucket,
      messagingSenderId,
    } = process.env
    
    const config = {
      Line: {
        channelId,
        channelSecret,
        channelAccessToken,
      },
      Api: {
        domain,
      },
      Firsebase: {
        apiKey,
        authDomain,
        databaseURL,
        projectId,
        storageBucket,
        messagingSenderId,
      }
    }
    return config
  }
  return {
    Line: {
      channelId: '',
      channelSecret: '',
      channelAccessToken: ''
    },
    Api: {
      domain: '',
    },
    Firsebase: {
      apiKey: '',
      authDomain: '',
      databaseURL: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: ''
    }
  }
}

export default getConfig