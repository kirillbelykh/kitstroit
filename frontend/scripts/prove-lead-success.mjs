#!/usr/bin/env node
/**
 * Proof: lead_success fires only after HTTP 201 (mirrors sendLead + LeadForm gate).
 * Run: node frontend/scripts/prove-lead-success.mjs
 */

async function sendLead(payload, fetchImpl) {
  const response = await fetchImpl('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (response.status !== 201) {
    const detail = await response.json().catch(() => null)
    const message = typeof detail?.detail === 'string'
      ? detail.detail
      : 'Не удалось отправить заявку'
    throw new Error(message)
  }

  return response.json()
}

function mockFetch(status, body = { id: 1 }) {
  return async () => {
    if (status === 'network') throw new TypeError('Failed to fetch')
    return {
      status,
      async json() {
        if (status === 201) return body
        return { detail: `error-${status}` }
      },
    }
  }
}

async function simulateSubmit({ fetchImpl, statusRef, lockRef, goals }) {
  if (lockRef.current || statusRef.current === 'sending' || statusRef.current === 'done') {
    return { skipped: true }
  }
  lockRef.current = true
  statusRef.current = 'sending'
  try {
    // awaitYmClientId always proceeds (null or id) — not asserted here
    await Promise.resolve(null)
    await sendLead({ name: 'Test', phone: '+7000', project_type: 'x', consent: true }, fetchImpl)
    goals.push('lead_success')
    statusRef.current = 'done'
    return { ok: true }
  } catch {
    goals.push('form_error')
    statusRef.current = 'error'
    lockRef.current = false
    return { ok: false }
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function run() {
  const cases = [
    { status: 201, expectGoal: 'lead_success' },
    { status: 200, expectGoal: 'form_error' },
    { status: 400, expectGoal: 'form_error' },
    { status: 409, expectGoal: 'form_error' },
    { status: 422, expectGoal: 'form_error' },
    { status: 429, expectGoal: 'form_error' },
    { status: 500, expectGoal: 'form_error' },
    { status: 'network', expectGoal: 'form_error' },
  ]

  let failed = 0

  for (const testCase of cases) {
    const goals = []
    const statusRef = { current: 'idle' }
    const lockRef = { current: false }
    const result = await simulateSubmit({
      fetchImpl: mockFetch(testCase.status),
      statusRef,
      lockRef,
      goals,
    })
    try {
      assert(goals.length === 1, `expected one goal, got ${goals.join(',')}`)
      assert(goals[0] === testCase.expectGoal, `expected ${testCase.expectGoal}, got ${goals[0]}`)
      if (testCase.status === 201) {
        assert(result.ok === true, '201 should succeed')
        assert(statusRef.current === 'done', 'status done')
        // double submit ignored
        const again = await simulateSubmit({
          fetchImpl: mockFetch(201),
          statusRef,
          lockRef,
          goals,
        })
        assert(again.skipped === true, 're-entry ignored when done')
        assert(goals.filter((g) => g === 'lead_success').length === 1, 'no double lead_success')
      } else {
        assert(result.ok === false, 'non-201 should fail')
      }
      console.log(`PASS status=${testCase.status} -> ${testCase.expectGoal}`)
    } catch (error) {
      failed += 1
      console.error(`FAIL status=${testCase.status}: ${error.message}`)
    }
  }

  // Success must not fire before await completes
  {
    const goals = []
    let resolveFetch
    const pending = new Promise((resolve) => { resolveFetch = resolve })
    const fetchImpl = () => pending.then(() => ({ status: 201, json: async () => ({ id: 7 }) }))
    const statusRef = { current: 'idle' }
    const lockRef = { current: false }
    const runPromise = simulateSubmit({ fetchImpl, statusRef, lockRef, goals })
    assert(goals.length === 0, 'no goal before await resolves')
    resolveFetch()
    await runPromise
    assert(goals[0] === 'lead_success', 'success after await')
    console.log('PASS no success before await completes')
  }

  if (failed) {
    console.error(`\n${failed} case(s) failed`)
    process.exit(1)
  }
  console.log('\nAll lead_success gate cases passed')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
