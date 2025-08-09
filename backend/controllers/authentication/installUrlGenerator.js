export const installUrlGenerator = (req, res) => {
    // accessing data
    const shop = req.query.shop;
    const { CLIENT_ID, SCOPES, HOST } = process.env;

    // returning if missing data
    if (!shop) return res.status(400).send("Missing shop param");

    // creating url
    const redirectUri = `${HOST}/auth/callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${redirectUri}`;

    console.log("Redircting to install URL.....")

    // redirecting to url
    res.redirect(installUrl);
}