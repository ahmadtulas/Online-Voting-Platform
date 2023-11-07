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

function ElectionNameDeleter(eid,qid)
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
function QuestionUpdater(eid,qid)
{
  fetch(`/elections/${eid}/questions/${qid}`, {})
  .then((res) => res.json())
  .then((question) => {
    fetch(`/elections/${eid}/questions/${qid}`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _csrf: token,
        ...question,
        title: document.getElementById("questionTitle-" + qid).value,
        description: document.getElementById(
          "questionDescription-" + qid
        ).value,
      }),
    })
      .then((res) => {
        if (res.ok) {
          window.location.reload();
        }
      })
  });
}
function QuestionDeleter(eid,qid)
{
  fetch(`/elections/${eid}/questions/${qid}`, {
    method: "delete",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      _csrf: token,
    }),
  })
    .then((res) => {
      if (res.ok) {
        window.location.reload(true);
      }
    })
}

function optionUpdater(eid, qid, oid) {
  fetch(
    `/elections/${eid}/questions/${qid}/options/${oid}`,
    {}
  )
    .then((res) => res.json())
    .then((option) => {
      fetch(
        `/elections/${eid}/questions/${qid}/options/${oid}`,
        {
          method: "put",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            _csrf: token,
            ...option,
            title: document.getElementById("optionTitle-" + oid).value,
          }),
        }
      )
        .then((res) => {
          if (res.ok) {
            window.location.reload(true);
          }
        })
    });
}

function optionDeleter(eid,qid,oid) {
  fetch(`/elections/${eid}/questions/${qid}/options/${oid}`, {
    method: "delete",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      _csrf: token,
    }),
  })
    .then((res) => {
      if (res.ok) {
        window.location.reload(true);
      }
    })
}
function voterDeleter(eid,vid)
{
  fetch(`/elections/${eid}/voters/${vid}`, {
    method: "delete",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      _csrf: token,
    }),
  })
    .then((res) => {
      if (res.ok) {
        window.location.reload(true);
      }
    })
}
