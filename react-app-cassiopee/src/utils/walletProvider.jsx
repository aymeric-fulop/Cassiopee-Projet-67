export async function requestAccount() {
    await window.ethereum.request({method: 'eth_requestAccounts'})
    .then(result => {accountChangedHandler});
}
