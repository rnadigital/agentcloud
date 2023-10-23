from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from init.env_variables import google_auth
from mongo.queries import MongoClientConnection


def google_ads_roas(customer_id):
    summary = dict()

    mongo_client = MongoClientConnection()
    token = mongo_client.get_refresh_token(customer_id)
    google_auth["refresh_token"] = token
    # Initialize the Google Ads client.
    google_ads_client = GoogleAdsClient.load_from_dict(google_auth)

    # Define the query to get average CPC.
    query = f"""
    SELECT
        campaign.id,
        ad_group.id,
        metrics.average_cpc
    FROM
        keyword_view
    WHERE
        segments.date DURING LAST_7_DAYS
    """

    try:
        # Execute the query.
        # response = (google_ads_client.service.google_ads.search(
        #     customer_id=customer_id, query=query
        # ))

        service = google_ads_client.get_service("GoogleAdsService")

        response = service.search_stream(
            customer_id=customer_id, query=query
        )

        # Iterate through the response to fetch the average CPC.
        for row in response:
            summary["Campaign ID"] = row.campaign.id.value
            summary["Ad Group ID"] = row.ad_group.id.value
            summary["Average CPC"] = row.metrics.average_cpc.value
        return summary
    except GoogleAdsException as ex:
        print(f"An error occurred: {ex}")


if __name__ == "__main__":
    s = google_ads_roas("5095191486")
    print(s)
