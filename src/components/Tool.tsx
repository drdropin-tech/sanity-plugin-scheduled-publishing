import {HOCRouter, withRouterHOC} from '@sanity/base/router'
import {CheckmarkIcon, EllipsisVerticalIcon, SortIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Label, Menu, MenuButton, MenuItem} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import {SCHEDULE_STATES, TOOL_HEADER_HEIGHT} from '../constants'
import usePollSchedules from '../hooks/usePollSchedules'
import {ScheduleSort, ScheduleState} from '../types'
import {debugWithName} from '../utils/debug'
import ScheduleFilters from './ScheduleFilters'
import Schedules from './Schedules'
import TimeZoneButton from './TimeZoneButton'
import ToolCalendar from './ToolCalendar'

const debug = debugWithName('Tool')

const Column = styled(Box)`
  flex-direction: column;
  &:not(:last-child) {
    border-right: 1px solid var(--card-border-color);
  }
`
interface Props {
  router: HOCRouter
}

function Tool(props: Props) {
  const {router} = props

  const [sortBy, setSortBy] = useState<ScheduleSort>('executeAt')

  // Poll for document schedules
  // TODO: handle error + isLoading states
  const {schedules} = usePollSchedules()

  const scheduleState: ScheduleState = router.state.state || 'scheduled'

  // Filter schedules by selected router state + sort conditionally
  const filteredSchedules = schedules
    .filter((schedule) => schedule.state === scheduleState)
    .sort((a, b) => {
      switch (scheduleState) {
        // Upcoming items are displayed in chronological order
        case 'scheduled':
          return a.executeAt >= b.executeAt ? 1 : -1
        // Everything else should be displayed in reverse order
        default:
          return a.executeAt >= b.executeAt ? -1 : 1
      }
    })

  debug('scheduleState', scheduleState)

  // Effects
  useEffect(() => {
    // Redirect to first schedule state on invalid routes
    if (!SCHEDULE_STATES.includes(scheduleState)) {
      router.navigate({state: SCHEDULE_STATES[0]})
    }
  }, [scheduleState])

  // Callbacks
  const handleSortByCreateAt = () => setSortBy('createdAt')
  const handleSortByExecuteAt = () => setSortBy('executeAt')

  return (
    <Card display="flex" flex={1} height="fill" overflow="auto">
      {/* LHS Column */}
      <Column
        display={['none', null, null, 'flex']}
        style={{
          position: 'sticky',
          top: 0,
          width: '350px',
        }}
      >
        <ToolCalendar />
      </Column>
      {/* RHS Column */}
      <Column flex={1}>
        <Flex
          align="center"
          paddingLeft={4}
          paddingRight={3}
          style={{
            borderBottom: '1px solid var(--card-border-color)',
            minHeight: `${TOOL_HEADER_HEIGHT}px`,
          }}
        >
          <Flex align="center" flex={1} justify="space-between">
            <ScheduleFilters scheduleState={scheduleState} schedules={schedules} />
            <Flex align="center" gap={1}>
              <TimeZoneButton />
              <MenuButton
                button={
                  <Button
                    icon={EllipsisVerticalIcon}
                    mode="bleed"
                    paddingX={2}
                    paddingY={3}
                    tone="default"
                  />
                }
                id="sort"
                menu={
                  <Menu style={{minWidth: '250px'}}>
                    <Box paddingX={3} paddingY={2}>
                      <Label muted size={1}>
                        Sort
                      </Label>
                    </Box>
                    <MenuItem
                      icon={SortIcon}
                      iconRight={sortBy === 'createdAt' ? CheckmarkIcon : undefined}
                      onClick={handleSortByCreateAt}
                      text="Sort by time added"
                    />
                    <MenuItem
                      icon={SortIcon}
                      iconRight={sortBy === 'executeAt' ? CheckmarkIcon : undefined}
                      onClick={handleSortByExecuteAt}
                      text="Sort by time scheduled"
                    />
                  </Menu>
                }
              />
            </Flex>
          </Flex>
        </Flex>
        <Box style={{overflowX: 'hidden', overflowY: 'auto'}} padding={4}>
          <Schedules schedules={filteredSchedules} scheduleState={scheduleState} sortBy={sortBy} />
        </Box>
      </Column>
    </Card>
  )
}

export default withRouterHOC(Tool)
