import {
    assert,
    ByteString,
    hash256,
    method,
    prop,
    SmartContract,
    FixedArray,
    fill,
    toByteString,
} from 'scrypt-ts'

export type Name = ByteString

export type Candidate = {
    name: Name
    votesReceived: bigint
}
export const N = 2

export type Candidates = FixedArray<Candidate, typeof N>

export class Voting extends SmartContract {
    @prop(true)
    candidates: Candidates

    constructor(candidateNames: FixedArray<Name, typeof N>) {
        super(...arguments)
        this.candidates = fill(
            {
                name: toByteString(''),
                votesReceived: 0n,
            },
            N
        )

        for (let i = 0; i < N; i++) {
            this.candidates[i] = {
                name: candidateNames[i],
                votesReceived: 0n,
            }
        }
    }

    /**
     * vote for a candidate
     * @param candidate candidate's name
     */
    @method()
    public vote(candidate: Name) {
        this.increaseVotesReceived(candidate)
        // output containing the latest state and the same balance
        let outputs: ByteString = this.buildStateOutput(this.ctx.utxo.value)
        if (this.changeAmount > 0n) {
            outputs += this.buildChangeOutput()
        }
        assert(this.ctx.hashOutputs === hash256(outputs), 'hashOutputs mismatch')
    }

    @method()
    increaseVotesReceived(candidate: Name): void {
        for (let i = 0; i < N; i++) {
            if (this.candidates[i].name === candidate) {
                this.candidates[i].votesReceived++
            }
        }
    }
}
