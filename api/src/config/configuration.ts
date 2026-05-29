/**
 * Created by bolorundurowb on 1/3/2021
 */

import * as dotenv from 'dotenv';

export default () => {
  dotenv.config();

  return {
    port: parseInt(process.env.PORT, 10) || 3000,
    auth: {
      secret: process.env.SECRET
    },
    database: {
      url: process.env.DB_URL
    },
    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN
    }
  };
};
