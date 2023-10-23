import logging

from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.adsinsights import AdsInsights
from facebook_business.exceptions import FacebookRequestError


def access_facebook_api(ad_account_id, app_id, app_secret, access_token):
    summary = dict()
    try:
        FacebookAdsApi.init(app_id, app_secret, access_token)
        ad_account = AdAccount('act_{}'.format(ad_account_id))

        # Define the fields and parameters
        fields = [
            AdsInsights.Field.account_name,
            AdsInsights.Field.purchase_roas,
        ]
        params = {
            # 'date_preset': AdsInsights.DatePreset.last_30d,
        }

        # Fetch the insights
        insights = ad_account.get_insights(fields=fields, params=params)
        # Print the campaign name and ROAS
        for insight in insights:
            summary["Campaign Name"] = insight[AdsInsights.Field.campaign_name]
            summary["ROAS"] = insight[AdsInsights.Field.purchase_roas]
    except FacebookRequestError as fre:
        logging.exception(fre)
    finally:
        return summary


if __name__ == "__main__":
    import os
    import dotenv

    dotenv.load_dotenv()

    fb_app_id = os.getenv("FB_APP_ID")
    fb_account_id = os.getenv("FB_ACCOUNT_ID")
    fb_secret = os.getenv("FB_SECRET_ID")
    fb_token = os.getenv("FB_TOKEN_ID")
    access_facebook_api(fb_account_id, fb_app_id, fb_secret, fb_token)
