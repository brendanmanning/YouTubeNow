function showBanner(message, inDiv)
{
	inDiv.innerHTML = "<div class='banner informational' onclick='this.parentNode.removeChild(this)'>" + message + " - tap to dismiss</div>" + inDiv.innerHTML;
}