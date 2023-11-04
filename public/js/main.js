const token = document
.querySelector(`meta[name="csrf-token"]`)
.getAttribute("content");

function ElectionNameUpdater(id)
{
    //alert("Election id is"+id);
    var newElectionName = document.getElementById("electionName"+id).value;
    //alert(newElectionName);
    console.log('calling');
    console.log(newElectionName);
    document.getElementById("loading").style.display = "inline";

    fetch(`/elections/${id}`, {})
          .then((res) => res.json())
          .then((election) => {
            fetch(`/updateElection/${id}`, {
                method: "put",
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify({
                _csrf: token,
                ...election,
                name: newElectionName,
                }),
        });
    });
    
    setTimeout(function() {
        //your code to be executed after 1 second
        document.getElementById("loading").style.display = "none";
      },1000);
}

function ElectionNameDeleter(id)
{
    fetch(`/elections/${id}`, {
        method: "delete",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _csrf: token,
        }),
      })
        .then((response) => {
          if (response.ok) {
            window.location.reload(true);
          }
        })
}