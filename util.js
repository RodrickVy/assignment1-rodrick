

 const createHTMLPage =( body)=>{
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PracticalPhilosophy</title>
    <meta name="description" content="Two way's to attain power and influence; warning, philosophical!">
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <link rel="icon" type="image/ico" href="img/favicon.ico">
    <link rel="stylesheet" type="text/css" href="/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
</head>
<body>
     ${body}
</body>
</html>`
}

 function getRandomOneToThree() {
     return Math.floor(Math.random() * 3) + 1;
 }

module.exports = {createHTMLPage,getRandomOneToThree}