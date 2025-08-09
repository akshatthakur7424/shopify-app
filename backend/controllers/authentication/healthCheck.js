export const healthCheck = (req, res) => {
    // accessing data
    const shop = req.query.shop;

    // returning if missing data
    if (!shop) {
        return res.status(400).send("Missing shop parameter");
    }

    console.log("Redirectin to auth route.....")
    // This HTML will break out of the iframe and redirect the parent window
    res.send(`
    <html>
      <body>
        <script type="text/javascript">
          if (window.top === window.self) {
            // If it's not inside an iframe, just redirect
            window.location.href = "/auth?shop=${shop}";
          } else {
            // If inside iframe, redirect parent window
            window.top.location.href = "/auth?shop=${shop}";
          }
        </script>
      </body>
    </html>
  `);
}