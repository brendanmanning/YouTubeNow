function param(id)
{
	return window.location.search.split("?" + id + "=")[1];
}
function paramset(id)
{
	return (param(id) != null)
}