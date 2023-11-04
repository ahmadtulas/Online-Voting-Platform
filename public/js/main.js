const token = document
.querySelector(`meta[name="csrf-token"]`)
.getAttribute("content");

function ElectionNameUpdater(id)
{
    alert("Election id is"+id);
    var newElectionName = document.getElementById("electionName"+id).value;
    alert(newElectionName);
    console.log('calling');
    console.log(newElectionName);

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

}